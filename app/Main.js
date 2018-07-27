/*
  Copyright 2017 Esri

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.​
*/

define([
  "calcite",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/i18n!./nls/resources",
  "ApplicationBase/ApplicationBase",
  "ApplicationBase/support/itemUtils",
  "ApplicationBase/support/domHelper",
  "dojo/touch",
  "dojo/on",
  "dojo/query",
  "dojo/dom",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "esri/core/Evented",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/identity/IdentityManager",
  "esri/portal/Portal",
  "esri/portal/PortalItem",
  "esri/Map",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/layers/Layer",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/Compass",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand"
], function (calcite, declare, lang, i18n, ApplicationBase, itemUtils, domHelper,
             touch, on, query, dom, domClass, domGeom, domConstruct,
             Evented, watchUtils, promiseUtils, IdentityManager, Portal, PortalItem,
             EsriMap, MapView, SceneView, Layer,
             Home, Search, Compass, LayerList, Legend, BasemapGallery, Expand) {
  /**
   *
   */
  return declare([Evented], {

    /**
     *  CONSTRUCTOR
     */
    constructor: function () {
      // CSS //
      this.CSS = {
        loading: "configurable-application--loading",
        NOTIFICATION_TYPE: {
          MESSAGE: "alert alert-blue animate-in-up is-active inline-block",
          SUCCESS: "alert alert-green animate-in-up is-active inline-block",
          WARNING: "alert alert-yellow animate-in-up is-active inline-block",
          ERROR: "alert alert-red animate-in-up is-active inline-block"
        }
      };
      // BASE APPLICATION //
      this.base = null;
      // CALCITE //
      calcite.init();
    },

    /**
     * INITIALIZE APPLICATION
     *
     * @param base
     * @returns {*}
     */
    init: function (base) {
      // BASE APPLICATION //
      this.base = base;

      // LOCALE AND DIRECTION //
      domHelper.setPageLocale(base.locale);
      domHelper.setPageDirection(base.direction);

      // LOCALIZED DEFAULT UI COMPONENTS //
      Object.keys(i18n.ui).forEach(node_id => {
        const ui_component = dom.byId(node_id);
        if(ui_component) {
          ui_component.innerHTML = i18n.ui[node_id].innerHTML || "";
          ui_component.title = i18n.ui[node_id].title || "";
        }
      });

      // APP TITLE //
      domHelper.setPageTitle(this.base.config.title);
      dom.byId("app-title-node").innerHTML = this.base.config.title;

      // USER SIGN IN //
      return this.initializeUserSignIn().always(() => {

        // CREATE MAP //
        this.createMap().then((map_infos) => {

          // ADD ITEM TO MAP //
          this.addItemToMap = this._addItemToMap(map_infos.map);

          // SYNC VIEWS //
          this.initializeSynchronizedViews(map_infos.views);

          // VIEW TYPE SWITCH //
          this.initializeViewTypeSwitch(map_infos.views);

          // INITIALIZE CONTENT //
          this.initializeGroupContent(this.base.config.group);

          // INITIALIZE CREATE MAP //
          this.initializeCreateOnlineMap(map_infos);

          // REMOVE LOADING //
          document.body.classList.remove(this.CSS.loading);
        });
      });
    },

    /**
     * SWITCH VIEW TYPES BETWEEN MAP VIEW AND SCENE VIEW
     *
     * @param views
     */
    initializeViewTypeSwitch: function (views) {

      // DISPLAY TYPE SWITCH //
      const display_switch = dom.byId("display-type-input");
      on(display_switch, "change", () => {
        const view_type = display_switch.checked ? "3d" : "2d";
        views.forEach((view, type) => {
          domClass.toggle(view.container, "visually-hidden", (type !== view_type));
        });
        this.emit("view-type-change", { type: view_type });
      });
      // INITIALLY HIDE THE 3D VIEW //
      domClass.add(views.get("3d").container, "visually-hidden");

    },

    /**
     * INITIALIZE USER SIGN IN
     *
     * @returns {*}
     */
    initializeUserSignIn: function (force_sign_in) {

      const checkSignInStatus = () => {
        return IdentityManager.checkSignInStatus(this.base.portal.url).then(userSignIn);
      };
      IdentityManager.on("credential-create", checkSignInStatus);
      IdentityManager.on("credential-destroy", checkSignInStatus);

      // SIGN IN NODE //
      const signInNode = dom.byId("sign-in-node");
      const userNode = dom.byId("user-node");

      // UPDATE UI //
      const updateSignInUI = () => {
        if(this.base.portal.user) {
          dom.byId("user-firstname-node").innerHTML = this.base.portal.user.fullName.split(" ")[0];
          dom.byId("user-fullname-node").innerHTML = this.base.portal.user.fullName;
          dom.byId("username-node").innerHTML = this.base.portal.user.username;
          dom.byId("user-thumb-node").src = this.base.portal.user.thumbnailUrl;
          domClass.add(signInNode, "hide");
          domClass.remove(userNode, "hide");
        } else {
          domClass.remove(signInNode, "hide");
          domClass.add(userNode, "hide");
        }
        return promiseUtils.resolve();
      };

      // SIGN IN //
      const userSignIn = () => {
        this.base.portal = new Portal({ url: this.base.config.portalUrl, authMode: "immediate" });
        return this.base.portal.load().then(() => {
          return updateSignInUI();
        }).otherwise(console.warn);
      };

      // SIGN OUT //
      const userSignOut = () => {
        IdentityManager.destroyCredentials();
        this.base.portal = new Portal({ url: this.base.config.portalUrl });
        this.base.portal.load().then(() => {
          this.base.portal.user = null;
          return updateSignInUI();
        }).otherwise(console.warn);

      };

      // USER SIGN IN //
      on(signInNode, "click", userSignIn);

      // SIGN OUT NODE //
      const signOutNode = dom.byId("sign-out-node");
      if(signOutNode) {
        on(signOutNode, "click", userSignOut);
      }

      return force_sign_in ? userSignIn() : checkSignInStatus();
    },

    /**
     * CREATE A MAP, MAP VIEW, AND SCENE VIEW
     *
     * @returns {Promise}
     */
    createMap: function () {

      // MAP //
      const map = new EsriMap({
        basemap: this.base.config.usePortalBasemap ? this.base.portal.defaultBasemap : { portalItem: { id: "39858979a6ba4cfd96005bbe9bd4cf82" } },
        ground: "world-elevation"
      });

      // SET VISIBILITY OF ALL MAP LAYERS //
      this.setAllLayersVisibility = (visible) => {
        map.layers.forEach(layer => {
          layer.visible = visible;
        });
      };

      // SCENE VIEW //
      const createSceneView = this.createView(map, "3d", "scene-node");

      // MAP VIEW //
      const createMapView = this.createView(map, "2d", "map-node");

      // RETURN VIEWS WHEN CREATED //
      return promiseUtils.eachAlways([createMapView, createSceneView]).then(createViewsResults => {
        // RETURN THE MAP AND VIEWS //
        return createViewsResults.reduce((map_info, createViewsResult) => {
          map_info.views.set(createViewsResult.value.type, createViewsResult.value);
          return map_info;
        }, { map: map, views: new Map() });
      });

    },

    /**
     * CREATE A MAP OR SCENE VIEW
     *
     * @param map
     * @param type
     * @param container_id
     * @returns {*}
     */
    createView: function (map, type, container_id) {

      // EARTH RADIUS //
      const EARTH_RADIUS = 6371000;

      // VIEW SETTINGS //
      const view_settings = {
        container: container_id,
        map: map,
        center: [5.0, 20.0],
        scale: 104255914,
        constraints: (type === "2d") ? { snapToZoom: false } : { altitude: { max: (EARTH_RADIUS * 6) } },
        highlightOptions: {
          color: "#00c0eb",
          haloOpacity: 0.8,
          fillOpacity: 0.2
        }
      };

      // VIEW //
      const view = (type === "2d") ? new MapView(view_settings) : new SceneView(view_settings);
      return view.when(() => {

        // LEFT CONTAINER //
        const left_container = dom.byId("item-info-container");
        // PANEL TOGGLE //
        const panelToggleBtn = domConstruct.create("div", {
          className: "panel-toggle-left icon-ui-left-triangle-arrow icon-ui-flush font-size-1",
          title: i18n.map.left_toggle.title
        }, view.root);
        on(panelToggleBtn, "click", () => {
          // TOGGLE PANEL TOGGLE BTNS //
          query(".panel-toggle-left").toggleClass("icon-ui-left-triangle-arrow icon-ui-right-triangle-arrow");
          // TOGGLE VISIBILITY OF CLOSABLE PANELS //
          domClass.toggle(left_container, "collapsed");
        });

        // UP CONTAINER //
        const up_container = dom.byId("items-list-panel");
        // PANEL TOGGLE //
        const listToggleBtn = domConstruct.create("div", {
          className: "panel-toggle-up icon-ui-up-arrow icon-ui-flush font-size-1",
          title: i18n.map.up_toggle.title
        }, view.root);
        on(listToggleBtn, "click", () => {
          // TOGGLE PANEL TOGGLE BTNS //
          query(".panel-toggle-up").toggleClass("icon-ui-up-arrow icon-ui-down-arrow");
          // TOGGLE VISIBILITY OF CLOSABLE PANELS //
          domClass.toggle(up_container, "collapsed");
          domClass.toggle("auto-scroll-container", "collapsed");
        });

        // VIEW UPDATING //
        const updating_node = domConstruct.create("div", { className: "view-loading-node loader text-center padding-leader-0 padding-trailer-0" });
        domConstruct.create("div", { className: "loader-bars" }, updating_node);
        domConstruct.create("div", { className: "loader-text font-size--3", innerHTML: "Updating..." }, updating_node);
        view.ui.add(updating_node, "bottom-right");
        watchUtils.init(view, "updating", (updating) => {
          domClass.toggle(updating_node, "is-active", updating);
        });

        // POPUP DOCKING OPTIONS //
        // TODO: FIGURE OUT HOW TO SYNC POPUP WINDOWS...
        view.popup.dockEnabled = true;
        view.popup.dockOptions = {
          buttonEnabled: false,
          breakpoint: false,
          position: "bottom-left"
        };

        // SEARCH //
        this.search = new Search({ view: view, searchTerm: this.base.config.search || "" });
        view.ui.add(this.search, { position: "top-left", index: 0 });

        // BASEMAPS //
        const basemapGalleryExpand = new Expand({
          view: view,
          content: new BasemapGallery({ view: view }),
          expandIconClass: "esri-icon-basemap",
          expandTooltip: i18n.map.basemapExpand.tooltip
        });
        view.ui.add(basemapGalleryExpand, { position: "top-left", index: 1 });

        // HOME //
        const homeWidget = new Home({ view: view });
        view.ui.add(homeWidget, { position: "top-left", index: 2 });

        // VIEW TYPE SPECIFIC //
        if(view.type === "2d") {
          // MapView //
          const compass = new Compass({ view: view });
          view.ui.add(compass, { position: "top-left", index: 5 });
        } else {
          // SceneView //
          this.initializeViewSpinTools(view);
        }

        // INITIALIZE LAYER LIST //
        this.initializeLayerList(view);

        // RETURN THE VIEW //
        return view;
      });

    },

    /**
     * INITIALIZE LAYER LIST WIDGET
     *  - REORDER, DETAILS, ZOOM TO, REMOVE
     *  - OPACITY SLIDER
     *  - LEGEND
     *
     * @param view
     */
    initializeLayerList: function (view) {

      // LAYERS PANEL //
      const layers_panel = domConstruct.create("div", { className: "panel panel-no-padding" });
      const action_node = domConstruct.create("div", { className: "panel panel-dark-blue panel-no-padding padding-left-half padding-right-1 font-size-0" }, layers_panel);
      domConstruct.create("span", { innerHTML: i18n.map.layers_panel.innerHTML }, action_node);

      // REMOVE ALL LAYERS //
      const remove_layers_btn = domConstruct.create("span", {
        className: "icon-ui-close-circled icon-ui-flush esri-interactive right",
        title: i18n.map.remove_layers.title
      }, action_node);
      on(remove_layers_btn, "click", () => {
        view.map.layers.removeAll();
        this.displayItemDetails();
      });
      // SET LAYERS VISIBILITY //
      const show_layers_btn = domConstruct.create("span", {
        className: "icon-ui-checkbox-checked esri-interactive right",
        title: i18n.map.show_layers.title
      }, action_node);
      on(show_layers_btn, "click", () => {
        this.setAllLayersVisibility(true);
        this.displayItemDetails();
      });
      const hide_layers_btn = domConstruct.create("span", {
        className: "icon-ui-checkbox-unchecked esri-interactive right",
        title: i18n.map.hide_layers.title
      }, action_node);
      on(hide_layers_btn, "click", () => {
        this.setAllLayersVisibility(false);
        this.displayItemDetails();
      });

      // CREATE OPACITY NODE //
      const createOpacityNode = (item, parent_node) => {
        const opacity_node = domConstruct.create("div", {
          className: "layer-opacity-node esri-widget",
          title: i18n.map.layer_opacity.title
        }, parent_node);
        const opacity_input = domConstruct.create("input", {
          className: "opacity-input",
          type: "range", min: 0, max: 1.0, step: 0.01,
          value: item.layer.opacity
        }, opacity_node);
        on(opacity_input, "input", () => {
          item.layer.opacity = opacity_input.valueAsNumber;
        });
        item.layer.watch("opacity", (opacity) => {
          opacity_input.valueAsNumber = opacity;
        });
        opacity_input.valueAsNumber = item.layer.opacity;
        return opacity_node;
      };
      // CREATE TOOLS NODE //
      const createToolsNode = (item, parent_node) => {
        // TOOLS NODE //
        const tools_node = domConstruct.create("div", { className: "esri-widget" }, parent_node, "first");

        // REORDER //
        const reorder_node = domConstruct.create("div", { className: "inline-block" }, tools_node);
        const reorder_up_node = domConstruct.create("button", {
          className: "btn-link esri-icon-arrow-up",
          title: i18n.map.move_layer_up.title
        }, reorder_node);
        const reorder_down_node = domConstruct.create("button", {
          className: "btn-link esri-icon-arrow-down",
          title: i18n.map.move_layer_down.title
        }, reorder_node);
        on(reorder_up_node, "click", () => {
          view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) + 1);
        });
        on(reorder_down_node, "click", () => {
          view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) - 1);
        });

        // REMOVE LAYER //
        const remove_layer_node = domConstruct.create("button", {
          className: "btn-link icon-ui-close right",
          title: i18n.map.remove_layer.title
        }, tools_node);
        on.once(remove_layer_node, "click", () => {
          view.map.remove(item.layer);
          this.emit("layer-removed", item.layer);
        });

        // ZOOM TO //
        const zoom_to_node = domConstruct.create("button", {
          className: "btn-link icon-ui-zoom-in-magnifying-glass right",
          title: i18n.map.zoom_to_layer.title
        }, tools_node);
        on(zoom_to_node, "click", () => {
          view.goTo(item.layer.fullExtent);
        });

        // LAYER DETAILS //
        const info_node = domConstruct.create("span", {
          className: "btn-link icon-ui-description icon-ui-blue right",
          title: i18n.map.view_details.title
        }, tools_node);
        on(info_node, "click", () => {
          this.displayItemDetails(item.layer.portalItem);
        });

        return tools_node;
      };
      // CREATE LEGEND NODE //
      const createLegendNode = (item, parent_node) => {

        const legend_panel = domConstruct.create("div", { className: "legend-panel esri-widget" }, parent_node);

        const legend = new Legend({
          container: domConstruct.create("div", {}, legend_panel),
          view: view,
          layerInfos: [{ layer: item.layer }]
        });

        const legend_toggle_node = domConstruct.create("button", {
          className: "legend-toggle btn-link icon-ui-down",
          title: i18n.map.legend_toggle.title
        }, legend_panel);
        const legend_toggle_label = domConstruct.create("div", {
          className: "font-size--2 inline-block hide",
          innerHTML: i18n.map.legend_label.innerHTML
        }, legend_toggle_node);

        on(legend_toggle_node, "click", () => {
          domClass.toggle(legend_toggle_label, "hide");
          domClass.toggle(legend_toggle_node, "legend-toggle-hidden icon-ui-down icon-ui-right");
          domClass.toggle(legend.domNode, "hide");
        });

      };
      // LAYER LIST //
      const layerList = new LayerList({
        view: view,
        container: domConstruct.create("div", {}, layers_panel),
        listItemCreatedFunction: (evt) => {
          let item = evt.item;
          if(item.layer && item.layer.portalItem) {

            // CREATE ITEM PANEL //
            const panel_node = domConstruct.create("div", { className: "esri-widget" });

            // LAYER TOOLS //
            createToolsNode(item, panel_node);

            // LAYER OPACITY //
            createOpacityNode(item, panel_node);

            // LEGEND //
            if(item.layer.legendEnabled) {
              createLegendNode(item, panel_node);
            }

            // SET ITEM PANEL //
            item.panel = {
              title: i18n.map.settings_panel.title,
              className: "esri-icon-settings",
              content: panel_node
            };
          }
        }
      });
      // LAYER LIST EXPAND //
      const layerListExpand = new Expand({
        view: view,
        content: layers_panel,
        iconNumber: 0,
        expandIconClass: "esri-icon-layers",
        expandTooltip: i18n.map.layerlist_expand.tooltip
      });
      view.ui.add(layerListExpand, { position: "top-right", index: 1 });

      // LAYER COUNT //
      view.map.layers.on("change", () => {
        layerListExpand.iconNumber = view.map.layers.length;
      });

      // SYNCHRONIZE LAYERLIST EXPANDS //
      layerListExpand.watch("expanded", (expanded) => {
        this.emit("layerlist-expanded", { expanded: expanded, source: layerListExpand });
      });
      this.on("layerlist-expanded", evt => {
        if((evt.source !== layerListExpand) && (evt.expanded !== layerListExpand.expanded)) {
          layerListExpand.toggle();
        }
      });

    },

    /**
     * SPIN SCENE VIEW
     *
     * @param view
     */
    initializeViewSpinTools: function (view) {

      let spin_direction = "none";
      let spin_handle = null;
      let spin_step = 0.05;
      const spin_fps = 60;

      const _spin = () => {
        if(spin_direction !== "none") {
          const camera = view.camera.clone();
          // WHAT IS THE APPROPRIATE ZOOM LEVEL TO SWITCH BETWEEN LOCAL AND GLOBAL? //
          if(view.zoom > 9) {
            // AT A 'LOCAL' SCALE WE CHANGE THE HEADING //
            camera.heading += ((spin_direction === "right") ? spin_step : -spin_step);
          } else {
            // AT A GLOBAL SCALE WE CHANGE THE LONGITUDE //
            camera.position.longitude += ((spin_direction === "right") ? spin_step : -spin_step);
            // MAINTAIN CURRENT HEADING OR FORCE UP //
            camera.heading = always_up ? 0.0 : camera.heading;
          }
          spin_handle = view.goTo(camera, { animate: false }).then(() => {
            if(spin_direction !== "none") {
              setTimeout(() => {
                requestAnimationFrame(_spin);
              }, (1000 / spin_fps));
            }
          });
        }
      };

      const enableSpin = (direction) => {
        spin_direction = direction;
        if(spin_direction !== "none") {
          requestAnimationFrame(_spin);
        } else {
          spin_handle && !spin_handle.isFulfilled() && spin_handle.cancel();
        }
      };

      const viewSpinNode = domConstruct.create("div", { className: "view-spin-node" }, view.root);
      const spinLeftBtn = domConstruct.create("span", { className: "spin-btn icon-ui-arrow-left-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_left.title }, viewSpinNode);
      const alwaysUpBtn = domConstruct.create("span", { id: "always-up-btn", className: "spin-btn icon-ui-compass icon-ui-flush font-size--1 esri-interactive", title: i18n.spin_tool.always_up.title }, viewSpinNode);
      const spinRightBtn = domConstruct.create("span", { className: "spin-btn icon-ui-arrow-right-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_right.title }, viewSpinNode);

      // SPIN LEFT //
      on(spinLeftBtn, "click", () => {
        enableSpin("none");
        domClass.remove(spinRightBtn, "selected");
        domClass.toggle(spinLeftBtn, "selected");
        if(domClass.contains(spinLeftBtn, "selected")) {
          enableSpin("left");
        }
      });

      // SPIN RIGHT //
      on(spinRightBtn, "click", () => {
        enableSpin("none");
        domClass.remove(spinLeftBtn, "selected");
        domClass.toggle(spinRightBtn, "selected");
        if(domClass.contains(spinRightBtn, "selected")) {
          enableSpin("right");
        }
      });

      // ALWAYS UP //
      let always_up = false;
      on(alwaysUpBtn, "click", () => {
        domClass.toggle(alwaysUpBtn, "selected");
        always_up = domClass.contains(alwaysUpBtn, "selected");
      });

    },

    /**
     * SYNCHRONIZE VIEWS
     *
     * @param views_infos
     */
    initializeSynchronizedViews: function (views_infos) {

      // SYNC VIEW //
      const synchronizeView = (view, others) => {
        others = Array.isArray(others) ? others : [others];

        let viewpointWatchHandle;
        let viewStationaryHandle;
        let otherInteractHandlers;
        let scheduleId;

        const clear = () => {
          if(otherInteractHandlers) {
            otherInteractHandlers.forEach((handle) => {
              handle.remove();
            });
          }
          viewpointWatchHandle && viewpointWatchHandle.remove();
          viewStationaryHandle && viewStationaryHandle.remove();
          scheduleId && clearTimeout(scheduleId);
          otherInteractHandlers = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
        };

        const interactWatcher = view.watch('interacting,animation', (newValue) => {
          if(!newValue) { return; }
          if(viewpointWatchHandle || scheduleId) { return; }

          if(!view.animation) {
            others.forEach((otherView) => {
              otherView.viewpoint = view.viewpoint;
            });
          }

          // start updating the other views at the next frame
          scheduleId = setTimeout(() => {
            scheduleId = null;
            viewpointWatchHandle = view.watch('viewpoint', (newValue) => {
              others.forEach((otherView) => {
                otherView.viewpoint = newValue;
              });
            });
          }, 0);

          // stop as soon as another view starts interacting, like if the user starts panning
          otherInteractHandlers = others.map((otherView) => {
            return watchUtils.watch(otherView, 'interacting,animation', (value) => {
              if(value) { clear(); }
            });
          });

          // or stop when the view is stationary again
          viewStationaryHandle = watchUtils.whenTrue(view, 'stationary', clear);
        });

        return {
          remove: () => {
            this.remove = () => {
            };
            clear();
            interactWatcher.remove();
          }
        }
      };
      // SYNC VIEWS //
      const synchronizeViews = (views) => {
        let handles = views.map((view, idx, views) => {
          const others = views.concat();
          others.splice(idx, 1);
          return synchronizeView(view, others);
        });

        return {
          remove: () => {
            this.remove = () => {
            };
            handles.forEach((h) => {
              h.remove();
            });
            handles = null;
          }
        }
      };

      // INIT SYNC VIEWS //
      synchronizeViews(Array.from(views_infos.values()));
    },

    /**
     *  INITIALIZE LAYER ITEM LIST SCROLLING
     *  - USING dojo/touch
     *  - NOT TESTED
     */
    initializeItemListScroll: function () {

      // CONTENT CONTAINER //
      const content_container = dom.byId("content-container-parent");
      const content_box = domGeom.getContentBox(content_container);
      const scrollLeftMax = (content_container.scrollWidth - content_box.w);

      // SCROLL OPTIONS //
      const scroll_options = {
        auto: false,
        direction: "NONE",
        distance: 3,
        auto_distance: 1,
        manual_distance: 3,
        step_distance: 200
      };

      // SCROLL ITEMS //
      const _scroll_items = () => {
        switch (scroll_options.direction) {
          case "LEFT":
            domClass.remove("auto-scroll-right", "direction-selected");
            domClass.add("auto-scroll-left", "direction-selected");

            content_container.scrollLeft -= scroll_options.distance;
            if(scroll_options.auto && (content_container.scrollLeft <= 0)) {
              scroll_options.direction = "RIGHT";
            }
            requestAnimationFrame(_scroll_items);
            break;

          case "RIGHT":
            domClass.remove("auto-scroll-left", "direction-selected");
            domClass.add("auto-scroll-right", "direction-selected");

            content_container.scrollLeft += scroll_options.distance;
            if(scroll_options.auto && (content_container.scrollLeft >= scrollLeftMax)) {
              scroll_options.direction = "LEFT";
            }
            requestAnimationFrame(_scroll_items);
            break;

          default:
            domClass.remove("auto-scroll-right", "direction-selected");
            domClass.remove("auto-scroll-left", "direction-selected");
        }
      };

      // AUTO SCROLL //
      const auto_scroll = (direction) => {
        if(direction) {
          scroll_options.direction = direction;
          scroll_options.distance = scroll_options.auto_distance;
          scroll_options.auto = true;
          _scroll_items();
          on.once(content_container, "click", () => {
            auto_scroll();
          });
        } else {
          scroll_options.direction = "NONE";
          scroll_options.distance = scroll_options.manual_distance;
          scroll_options.auto = false;
        }
      };

      // LEFT //
      on(dom.byId("items-list-left"), touch.press, () => {
        scroll_options.direction = "LEFT";
        scroll_options.distance = scroll_options.manual_distance;
        scroll_options.auto = false;
        _scroll_items();
      });
      on(dom.byId("items-list-left"), touch.release, () => {
        scroll_options.direction = "NONE";
        scroll_options.distance = scroll_options.manual_distance;
        scroll_options.auto = false;
      });
      // RIGHT //
      on(dom.byId("items-list-right"), touch.press, () => {
        scroll_options.direction = "RIGHT";
        scroll_options.distance = scroll_options.manual_distance;
        scroll_options.auto = false;
        _scroll_items();
      });
      on(dom.byId("items-list-right"), touch.release, () => {
        scroll_options.direction = "NONE";
        scroll_options.distance = scroll_options.manual_distance;
        scroll_options.auto = false;
      });
      // INITIATE AUTO SCROLL //
      on(dom.byId("auto-scroll-left"), "click", () => {
        if(scroll_options.direction === "LEFT") {
          auto_scroll();
        } else {
          auto_scroll("LEFT");
        }
      });
      on(dom.byId("auto-scroll-right"), "click", () => {
        if(scroll_options.direction === "RIGHT") {
          auto_scroll();
        } else {
          auto_scroll("RIGHT");
        }
      });

      // AUTO SCROLL ON STARTUP //
      if(this.base.config.autoScroll) {
        setTimeout(() => {
          auto_scroll("RIGHT");
        }, 1500);
      }

      // RESET //
      on(dom.byId("auto-scroll-reset"), "click", () => {
        auto_scroll();
        content_container.scrollLeft = 0;
      });

      // MANUALLY SCROLL LIST //
      const content_list = dom.byId("content-container");
      on(content_list, touch.press, (press_evt) => {
        press_evt.preventDefault();
        let clientX = press_evt.clientX;
        const move_handle = on(content_list, touch.move, (move_evt) => {
          // https://github.com/asvd/dragscroll/blob/master/dragscroll.js#L68
          content_container.scrollLeft -= (-clientX + (clientX = move_evt.clientX));
        });
        on.once(content_list, touch.release, (release_evt) => {
          release_evt.preventDefault();
          move_handle.remove();
        });
        on.once(content_list, touch.cancel, (cancel_evt) => {
          cancel_evt.preventDefault();
          move_handle.remove();
        });
      });

    },

    /**
     * INITIALIZE GROUP CONTENT
     *
     * @param group_id
     */
    initializeGroupContent: function (group_id) {

      // FIND GROUP //
      return this.base.portal.queryGroups({ query: `id:${group_id}` }).then((groupResponse) => {
        // DID WE FIND THE GROUP //
        if(groupResponse.results.length > 0) {
          // CONFIGURED GROUP //
          const portal_group = groupResponse.results[0];

          // INITIALIZE PANEL CONTENT AND GET FUNCTION TO DISPLAY ITEM DETAILS //
          this.displayItemDetails = this.initializePanelContent(portal_group);

          // SEARCH FOR GROUP ITEMS //
          return this.getGroupItems(portal_group, 1).then(() => {
            // CREATE LAYER ITEM LIST SCROLL //
            this.initializeItemListScroll();
          });

        } else {
          // WE DIDN'T FIND THE GROUP, SO LET'S FORCE THE USER TO SIGN IN AND TRY AGAIN //
          // TODO: DO WE STILL NEED THIS?
          return this.initializeUserSignIn(true).always(() => {
            return this.initializeGroupContent(group_id);
          });
        }
      });

    },

    /**
     * QUERY FOR LAYER ITEMS IN THE GROUP
     *  - ONLY ONE SEARCH SO MAXIMUM 100 ITEMS RETURNED
     *  - USES GROUP CONFIGURED SORT PARAMETERS
     *
     * @param portalGroup
     * @param start
     */
    getGroupItems: function (portalGroup, start) {

      // SEARCH QUERY //
      // TODO: DO WE INCLUDE CURRENT CULTURE IN THE QUERY?
      const layer_search_query = '(type:Service AND typekeywords:(-"Tool" -"Geodata Service" -"Globe Service" -"Database" -"Workflow" -"Service Definition"))';

      // FIND LAYER ITEMS //
      return portalGroup.queryItems({
        start: start,
        num: 100,
        sortField: portalGroup.sortField || "title",
        sortOrder: portalGroup.sortOrder || "asc",
        query: layer_search_query
      }).then((queryResults) => {
        // DISPLAY LAYER ITEMS //
        this.displayLayerItems(queryResults.results);
        // TODO: GET MORE RESULTS?
        return queryResults;
      });
    },

    /**
     * CREATE A SCROLLABLE LIST OF LAYER ITEMS NODES //
     *
     * @param layer_items
     */
    displayLayerItems: function (layer_items) {

      // CREATE LAYER ITEM NODES //
      layer_items.forEach(layer_item => {

        // LAYER ITEM NODE //
        const item_node = domConstruct.create("div", {
          className: "content-item",
        }, "content-container");

        // THUMBNAIL NODE //
        const item_img = domConstruct.create("img", {
          className: "content-item-img",
          src: layer_item.thumbnailUrl
        }, item_node);

        // ACTION NODE //
        const action_node = domConstruct.create("span", {
          className: "item-actions text-center text-white",
        }, item_node);

        // ADD BUTTON //
        const add_btn = domConstruct.create("span", {
          className: "item-action icon-ui-down",
          title: i18n.item.add_to_map.title
        }, action_node);

        // ADD VISIBLE BUTTON //
        const add_visible_btn = domConstruct.create("span", {
          className: "item-action leader-half esri-icon-visible",
          title: i18n.item.add_to_map_only_visible.title
        }, action_node);

        // TITLE NODE //
        const item_title_node = domConstruct.create("div", {
          className: "content-item-title avenir-demi font-size-0 esri-interactive icon-ui-description",
          innerHTML: layer_item.title.trim()
        }, item_node);

        // DISPLAY ITEM DETAILS //
        on(item_title_node, "click", () => {
          this.displayItemDetails(layer_item);
        });
        // ADD LAYER //
        on(add_btn, "click", () => {
          this.addItemToMap(layer_item);
          this.displayItemDetails(layer_item);
        });
        // ADD LAYER VISIBLE //
        on(add_visible_btn, "click", () => {
          this.setAllLayersVisibility(false);
          this.addItemToMap(layer_item);
          this.displayItemDetails(layer_item);
        });

      });

    },

    /**
     * SET PANEL CONTENT TO LAYER ITEM OR GROUP
     *
     * @param portal_group
     * @returns {function(*=)}
     */
    initializePanelContent: function (portal_group) {

      // UPDATE THE PANEL CONTENT WITH INFORMATION ABOUT A LAYER ITEM OR THE CONFIGURED GROUP //
      const display_content = (item_or_group) => {
        if(item_or_group) {
          // IS ITEM OR GROUP //
          const type = (item_or_group.declaredClass === "esri.portal.PortalGroup") ? "group" : "item";
          domClass.toggle("content-reset-node", "btn-disabled", (type === "group"));
          // TITLE //
          dom.byId("content-title-label").innerHTML = item_or_group.title;
          dom.byId("content-title-label").title = item_or_group.snippet || "";
          // DETAILS LINK //
          dom.byId("content-details-link").href = `${this.base.portal.url}/home/${type}.html?id=${item_or_group.id}`;
          // DESCRIPTION //
          dom.byId("content-description").innerHTML = item_or_group.description || ((type === "group") ? i18n.panel.missing_description_group : i18n.panel.missing_description_item);
        }
      };

      // RESET PANEL CONTENT //
      on(dom.byId("content-reset-node"), "click", () => {
        display_content(portal_group);
      });

      // SET INITIAL PANEL CONTENT TO GROUP //
      display_content(portal_group);

      /**
       * SET PANEL CONTENT TO LAYER ITEM
       */
      return (layer_item) => {
        // IF NO ITEM IS PROVIDED THEN USE THE CONFIGURED GROUP //
        display_content(layer_item || portal_group);
      }

    },

    /**
     * ADD ITEM TO MAP
     *  - IF THE LAYER IS ALREADY IN THE MAP, JUST MAKE SURE IT'S VISIBLE
     *
     * @param map
     */
    _addItemToMap: function (map) {

      return (item) => {

        // IS LAYER ALREADY IN THE MAP //
        let item_layer = map.layers.find(layer => {
          return (layer.portalItem.id === item.id);
        });
        if(item_layer) {
          // IF ALREADY IN THE MAP, JUST MAKE IT VISIBLE //
          item_layer.visible = true;

        } else {
          // GET LAYER FROM ITEM //
          this.getItemLayer(item).then((itemLayer) => {
            item_layer = itemLayer;

            // ADD LAYER TO MAP //
            map.add(item_layer);
            // ADD NOTIFICATION //
            this.addLayerNotification(item);

            // RESET PANEL IF LAYER REMOVED //
            this.on("layer-removed", (removed_layer) => {
              if(removed_layer.id === item_layer.id) {
                this.displayItemDetails();
              }
            });

          }).otherwise(error => {
            this.addLayerNotification(item, error);
          });
        }

      };
    },

    /**
     * MAKE SURE TO RETURN A LOADED PortalItem
     *
     * @param itemLike
     * @returns {Promise<PortalItem>}
     * @private
     */
    _getItem: function (itemLike) {
      if(itemLike.declaredClass === "esri.portal.PortalItem") {
        return itemLike.loaded ? promiseUtils.resolve(itemLike) : itemLike.load();
      } else {
        const item = new PortalItem({ id: itemLike.id });
        return item.load();
      }
    },

    /**
     * GET THE LAYER FROM THE PortalItem
     *  - APPLY OVERRIDES IF AVAILABLE
     *
     * @param itemLike
     * @returns {*}
     */
    getItemLayer: function (itemLike) {

      // GET FULL ITEM //
      return this._getItem(itemLike).then((item) => {
        // IS ITEM A LAYER //
        if(item.isLayer) {
          // CREATE LAYER FROM ITEM //
          return Layer.fromPortalItem({ portalItem: item }).then((layer) => {
            // LOAD LAYER //
            return layer.load().then(() => {
              // FETCH ITEM OVERRIDES //
              return layer.portalItem.fetchData().then((item_data) => {
                // APPLY IF LAYER HAVE ANY OVERRIDES //
                if(item_data != null) {
                  // VISIBILITY //
                  if(item_data.hasOwnProperty("visibility")) {
                    layer.visible = item_data.visibility;
                  }
                  // OPACITY //
                  if(item_data.hasOwnProperty("opacity")) {
                    layer.opacity = item_data.opacity;
                  }
                  switch (layer.type) {
                    case "map-image":
                      // SUBLAYER VISIBILITY - 4.8 //
                      if(item_data.hasOwnProperty("visibleLayers")) {
                        const visible_layers = item_data.visibleLayers || [];
                        layer.allSublayers.forEach(sublayer => {
                          sublayer.visible = visible_layers.includes(sublayer.id);
                        });
                      }
                      break;
                  }
                }

                switch (layer.type) {
                  case "unknown":
                    // LAYER IS UNKNOWN //
                    return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.layer_unknown_template, item)));
                  case "unsupported":
                    // LAYER IS UNSUPPORTED //
                    return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.layer_unsupported_template, item)));
                  default:
                    // LAYER LOADED OK //
                    return promiseUtils.resolve(layer);
                }
              });
            }).otherwise(() => {
              // LAYER WAS NOT LOADED //
              return promiseUtils.reject(new Error(layer.loadError));
            });
          }).otherwise(() => {
            // COULDN'T CREATE LAYER FROM ITEM //
            return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.layer_no_create_template, item)));
          });
        } else {
          // ITEM IS NOT A LAYER //
          return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.item_not_layer_template, item)));
        }

      });

    },

    /**
     * ADD A LAYER ITEM NOTIFICATION
     *
     * @param layer_item
     * @param error
     */
    addLayerNotification: function (layer_item, error) {
      const notificationsNode = dom.byId("notifications-node");

      const alertNode = domConstruct.create("div", {
        className: error ? this.CSS.NOTIFICATION_TYPE.ERROR : this.CSS.NOTIFICATION_TYPE.SUCCESS
      }, notificationsNode);

      const alertCloseNode = domConstruct.create("div", { className: "inline-block esri-interactive icon-ui-close margin-left-1 right" }, alertNode);
      on.once(alertCloseNode, "click", () => {
        domConstruct.destroy(alertNode);
      });

      domConstruct.create("div", { innerHTML: error ? error.message : lang.replace(i18n.notifications.layer_added_template, layer_item) }, alertNode);

      if(error != null) {
        const itemDetailsPageUrl = `${this.base.portal.url}/home/item.html?id=${layer_item.id}`;
        domConstruct.create("a", { innerHTML: i18n.notifications.view_details.innerHTML, target: "_blank", href: itemDetailsPageUrl }, alertNode);
      } else {
        setTimeout(() => {
          domClass.toggle(alertNode, "animate-in-up animate-out-up");
          setTimeout(() => {
            domConstruct.destroy(alertNode);
          }, 500)
        }, 2000);
      }

    },

    /**
     * OPEN THE MAP VIEWER USING THE CURRENT MAP SETTINGS AND LAYERS
     *  - https://doc.arcgis.com/en/arcgis-online/reference/use-url-parameters.htm
     *
     * @param map_infos
     */
    initializeCreateOnlineMap: function (map_infos) {

      // MAP LINK CLICK //
      on(dom.byId("create-map-btn"), "click", () => {

        // CURRENT VIEW //
        const display_type = dom.byId("display-type-input").checked ? "2d" : "3d";
        const view = map_infos.views.get(display_type);

        // MAP VIEWER URL //
        let map_viewer_url_parameters = `center=${view.center.longitude},${view.center.latitude}&level=${Math.floor(view.zoom)}&`;

        // BASEMAP URL //
        if(map_infos.map.basemap.baseLayers.length > 0) {
          // ASSUMES THERE'S ONLY ONE //
          map_viewer_url_parameters += `basemapUrl=${map_infos.map.basemap.baseLayers.getItemAt(0).url}&`;
        }

        // REFERENCE URL //
        if(map_infos.map.basemap.referenceLayers.length > 0) {
          // ASSUMES THERE'S ONLY ONE //
          map_viewer_url_parameters += `basemapReferenceUrl=${map_infos.map.basemap.referenceLayers.getItemAt(0).url}&`;
        }

        // LAYERS //
        const layer_ids = map_infos.map.layers.map(layer => {
          return layer.portalItem.id;
        });
        map_viewer_url_parameters += `layers=${layer_ids.join(",")}`;

        // MAP VIEWER URL //
        const map_viewer_url = `${this.base.portal.url}/home/webmap/viewer.html`;

        // OPEN MAP VIEWER //
        //window.open(`${encodeURI(map_viewer_url)}?${encodeURIComponent(map_viewer_url_parameters)}`);
        window.open(`${map_viewer_url}?${map_viewer_url_parameters}`);
      });

    }

  });
});
