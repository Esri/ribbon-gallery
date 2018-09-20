/*
  Copyright 2018 Esri

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
import ApplicationBase = require("ApplicationBase/ApplicationBase");
import i18n = require("dojo/i18n!./nls/resources");
import Evented = require("esri/core/Evented");

import promiseUtils = require("esri/core/promiseUtils");
import watchUtils = require("esri/core/watchUtils");
import requireUtils = require("esri/core/requireUtils");

import Portal = require("esri/portal/Portal");
import PortalItem = require("esri/portal/PortalItem");
import Layer = require("esri/layers/Layer");
import Map = require("esri/Map");

import MapView = require("esri/views/MapView");
import SceneView = require("esri/views/SceneView");

import Expand = require("esri/widgets/Expand");
import Home = require("esri/widgets/Home");
import Compass = require("esri/widgets/Compass");
import Legend = require("esri/widgets/Legend");
import LayerList = require("esri/widgets/LayerList");

import IdentityManager = require("esri/identity/IdentityManager");

// We can phase these out to use native methods (if browser support is good) 
import domClass = require("dojo/dom-class");
import domGeom = require("dojo/dom-geometry");
import domConstruct = require("dojo/dom-construct");
import touch = require("dojo/touch");
import on = require("dojo/on");
import lang = require("dojo/_base/lang");

import esri = __esri;
declare var window: any;

const CSS = {
    loading: "configurable-application--loading",
    NOTIFICATION_TYPE: {
        MESSAGE: "alert alert-blue animate-in-up is-active inline-block",
        SUCCESS: "alert alert-green animate-in-up is-active inline-block",
        WARNING: "alert alert-yellow animate-in-up is-active inline-block",
        ERROR: "alert alert-red animate-in-up is-active inline-block"
    }
};
import {
    setPageLocale,
    setPageDirection,
    setPageTitle
} from "ApplicationBase/support/domHelper";
import { Point } from "esri/geometry";


class Main extends (Evented) {

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    setAllLayersVisibility: any;
    remove: any;
    addItemToMap: any;
    displayItemDetails: any;
    //----------------------------------
    //  ApplicationBase
    //----------------------------------
    base: ApplicationBase = null;

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    public init(base: ApplicationBase): void {
        if (!base) {
            console.error("ApplicationBase is not defined");
            return;
        }
        // Calcite needed for sign-in dropdown experience
        window.calcite.init();
        this.importPolyfills();
        this.base = base;
        const { config } = base;
        // APPLY SHARED THEMING 
        this.applySharedTheme(base);
        // LOCALE AND DIRECTION //
        setPageLocale(base.locale);
        setPageDirection(base.direction);

        // LOCALIZED DEFAULT UI COMPONENTS //
        Object.keys(i18n.ui).forEach(node_id => {
            const ui_component = document.getElementById(node_id);
            if (ui_component) {
                if (i18n.ui[node_id].innerHTML) {
                    ui_component.innerHTML = i18n.ui[node_id].innerHTML;
                }
                if (i18n.ui[node_id].title) {
                    ui_component.title = i18n.ui[node_id].title || "";
                }
            }
        });

        // APP TITLE // 
        setPageTitle(config.title);
        const appTitle = document.getElementById("app-title-node");
        appTitle.innerHTML = config.title;
        appTitle.title = config.title;

        // USER SIGN IN // 
        return this.initializeUserSignIn().always(() => {
            // CREATE MAP //
            this.createMap().then((map_infos) => {

                // ADD ITEM TO MAP //
                this.addItemToMap = this._addItemToMap(map_infos.map);

                // SYNC VIEWS //
                if (this.base.config.displayMode === "both") {
                    // SHOW THE VIEW TYPE SWITCH
                    document.getElementById("display-mode-toggle").classList.remove("visually-hidden");
                    this.initializeSynchronizedViews(map_infos.views);
                    // VIEW TYPE SWITCH//
                    this.initializeViewTypeSwitch(map_infos.views);
                }

                // INITIALIZE CONTENT //
                this.initializeGroupContent(this.base.config.group);

                // INITIALIZE CREATE MAP //
                if (this.base.config.createMap) {
                    document.getElementById("create-map-btn").classList.remove("hide");
                    this.initializeCreateOnlineMap(map_infos);
                }

                // REMOVE LOADING //
                document.body.classList.remove(CSS.loading);
            });
        });
    }
    // APPLY THEME DEFINED BY THE ORG OR CUSTOMIZED VIA CONFIG
    applySharedTheme(base: ApplicationBase) {
        let styles = `
        .top-nav{
            background-color:${base.config.headerBackground};
            background-image:${base.config.headerBackgroundImage ? 'url(./assets/topo3.png)' : 'none'};
        }
        .text-white, .panel-toggle-up{
            color: ${base.config.headerColor};
        }
        .content-item-title{
            color: ${base.config.linkColor};
        }
        .toggle-switch-track:after{
            background-color: ${base.config.switchButtonColor};
        }
        .esri-icon-light-blue:before, .icon-ui-light-blue:before{
            color:${base.config.navButtonColor};
        }
        .pulse:before{
            color: ${base.config.navGlobeColor};
        }
        .nav-btn .svg-icon{
            fill: ${base.config.navButtonColor};
        }
        #content_title .text-blue, a{
            color: ${base.config.panelLink};
        }
        .panel-white{
            background-color: ${base.config.panelBackground};
            color: ${base.config.panelColor};
        }       
        `;

        var style = document.createElement("style");
        style.appendChild(document.createTextNode(styles));
        document.head.appendChild(style);


    }
    // ADD SUPPORT FOR ARRAY.FROM TO BROWSERS (IE11)
    importPolyfills() {
        let promises = [];
        if (!Array.from) {
            promises.push(import("app/polyfills/array.from.js"));
        }
        return Promise.all(promises);
    }
    /**
     * SWITCH VIEW TYPES BETWEEN MAP VIEW AND SCENE VIEW
     *
     * @param views
     */
    initializeViewTypeSwitch(views: (MapView | SceneView)[]) {
        // DISPLAY TYPE SWITCH //
        const display_switch = document.getElementById("display-type-input") as HTMLInputElement;
        on(display_switch, "change", () => {

            const view_type = display_switch.checked ? "3d" : "2d";

            //  const arrayViews: (MapView | SceneView)[] = [views.get("3d"), views.get("2d")];
            // const arrayViews: (MapView | SceneView)[] = views;
            views.forEach((view: MapView | SceneView) => {
                domClass.toggle(view.container, "visually-hidden", (view.type !== view_type));
            });

            this.emit("view-type-change", { type: view_type });
        });
        // INITIALLY HIDE THE 3D VIEW //
        views.forEach((view) => {
            if (view.type === "3d") {
                domClass.add(view.container, "visually-hidden");
            }
        });
    }

    /**
     * INITIALIZE USER SIGN IN
     *
     * @returns {*}
     */
    initializeUserSignIn(force_sign_in?): any {

        IdentityManager.useSignInPage = false;
        // Overwrite boilerplate behavior and set oauth popup to false
        // const oAuthInfo = IdentityManager.findOAuthInfo(this.base.portal.url);
        //if(oAuthInfo){
        //   oAuthInfo.popup = false;
        //}
        const checkSignInStatus = () => {
            return IdentityManager.checkSignInStatus(this.base.portal.url).then(userSignIn);
        };
        IdentityManager.on("credential-create", checkSignInStatus);
        IdentityManager.on("credentials-destroy", checkSignInStatus);

        // SIGN IN NODE //
        const signInNode = document.getElementById("sign-in-node");
        const userNode = document.getElementById("user-node");

        // UPDATE UI //
        const updateSignInUI = () => {
            if (this.base.portal.user) {
                document.getElementById("user-firstname-node").innerHTML = this.base.portal.user.fullName.split(" ")[0];
                document.getElementById("user-fullname-node").innerHTML = this.base.portal.user.fullName;
                document.getElementById("username-node").innerHTML = this.base.portal.user.username;
                if (this.base.portal.user.thumbnailUrl) {
                    const thumbnail = document.getElementById("user-thumb-node") as HTMLImageElement;
                    thumbnail.src = this.base.portal.user.thumbnailUrl;
                }
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
        signInNode.addEventListener("click", userSignIn);
        // SIGN OUT NODE //
        const signOutNode = document.getElementById("sign-out-node");
        if (signOutNode) {
            signOutNode.addEventListener("click", userSignOut);
        }

        return force_sign_in ? userSignIn() : checkSignInStatus();
    }
    /**
     * CREATE A MAP, MAP VIEW, AND SCENE VIEW
     *
     * @returns {Promise}
     */
    createMap(): any {
        let basemap = this.base.config.defaultBasemap;
        if (this.base.config.usePortalBasemap) {
            basemap = this.base.portal.defaultBasemap
        } else if (this.base.config.webmap) {
            basemap = {
                portalItem: { id: this.base.config.webmap as string }
            }
        }
        const map = new Map({
            basemap: basemap,
            ground: "world-elevation"
        });
        // SET VISIBILITY OF ALL MAP LAYERS //

        this.setAllLayersVisibility = (visible) => {
            map.layers.forEach(layer => {
                layer.visible = visible;
            });
        };

        const views = [];
        if (this.base.config.displayMode === "both" || this.base.config.displayMode === "3d") {
            // SCENE VIEW //
            domClass.remove("scene-node", "visually-hidden");
            views.push(this.createView(map, "3d", "scene-node"));
        }
        if (this.base.config.displayMode === "both" || this.base.config.displayMode === "2d") {
            // MAP VIEW //
            domClass.remove("map-node", "visually-hidden");
            views.push(this.createView(map, "2d", "map-node"));
        }

        // RETURN VIEWS WHEN CREATED //
        return promiseUtils.eachAlways(views).then(createViewsResults => {
            // RETURN THE MAP AND VIEWS //
            const map_info = {
                map: map,
                views: []
            };
            createViewsResults.forEach(createViewsResult => {
                map_info.views.push(createViewsResult.value);
            });
            return map_info;

        });
    }
    /**
    * CREATE A MAP OR SCENE VIEW
    *
    * @param map
    * @param type
    * @param container_id
    * @returns {*}
    */
    async createView(map: Map, type: string, container_id: string) {
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
        try {
            await view.when();
        } catch (error) {
            // TODO handle disabling 3d for browsers 
            // that don't support web gl
            console.log("Error", error);
        }

        // Collapse panels on load for small (phone) screen sizes 
        const collapse = (view.widthBreakpoint === "xsmall") ? true : false;
        // LEFT CONTAINER // 
        const left_container = document.getElementById("item-info-container");
        // PANEL TOGGLE // 
        const panelToggleBtn = domConstruct.create("button", {
            className: `panel-toggle-left btn btn-transparent icon-ui-flush font-size-1 ${collapse ? "icon-ui-right-triangle-arrow" : "icon-ui-left-triangle-arrow"}`,
            title: i18n.map.left_toggle.title
        }, view.root);

        panelToggleBtn.addEventListener("click", () => {
            // TOGGLE PANEL TOGGLE BTNS //
            domClass.toggle(panelToggleBtn, "icon-ui-left-triangle-arrow icon-ui-right-triangle-arrow");
            // TOGGLE VISIBILITY OF CLOSABLE PANELS //
            domClass.toggle(left_container, "collapsed");
        });
        // UP CONTAINER //
        const up_container = document.getElementById("items-list-panel");
        // PANEL TOGGLE //
        const listToggleBtn = domConstruct.create("button", {
            className: `panel-toggle-up btn btn-transparent icon-ui-flush font-size-1 ${collapse ? "icon-ui-down-arrow" : "icon-ui-up-arrow"}`,
            title: i18n.map.up_toggle.title
        }, view.root);

        if (collapse) {
            up_container.classList.add("collapsed");
            left_container.classList.add("collapsed");
        }

        listToggleBtn.addEventListener("click", () => {
            domClass.toggle(listToggleBtn, "icon-ui-up-arrow icon-ui-down-arrow");
            // TOGGLE VISIBILITY OF CLOSABLE PANELS //
            up_container.classList.toggle("collapsed");
            const scroll_container = document.getElementById("auto-scroll-container");
            if (scroll_container) {
                scroll_container.classList.toggle("collapsed");
            }

        });
        // VIEW UPDATING //
        const updating_node = domConstruct.create("div", { className: "view-loading-node loader text-center padding-leader-0 padding-trailer-0" });
        updating_node.innerHTML = `<div class="loader-bars"></div><div class="loader-text font-size--3">${i18n.notifications.updating} ...</div>`

        view.ui.add(updating_node, "bottom-right");
        watchUtils.init(view, "updating", (updating) => {
            domClass.toggle(updating_node, "is-active", updating);
        });
        // POPUP DOCKING OPTIONS //
        view.popup.dockEnabled = true;
        view.popup.dockOptions = {
            buttonEnabled: false,
            breakpoint: false,
            position: "bottom-left"
        };

        if (this.base.config.search) {
            requireUtils.when(require, [
                "esri/widgets/Search"
            ]).then(([
                Search
            ]) => {
                const search = new Search({ view, searchTerm: this.base.config.searchTerm || "" });
                const searchExpand = new Expand({
                    view,
                    mode: "floating",
                    content: search
                });
                view.ui.add(searchExpand, { position: this.base.config.searchPosition, index: 0 });
            });
        }
        if (this.base.config.basemaps) {
            requireUtils.when(require, [
                "esri/widgets/BasemapGallery",
                "esri/widgets/BasemapGallery/support/PortalBasemapsSource"
            ]).then(([
                BasemapGallery, PortalBasemapsSource
            ]) => {
                // add the current basemap to the gallery if its not already there
                const source = new PortalBasemapsSource({
                    updateBasemapsCallback: (portalBasemaps) => {
                        let found = false;
                        if (view.map && view.map.basemap && view.map.basemap.thumbnailUrl && view.map.basemap.thumbnailUrl.indexOf("js.arcgis.com") !== -1) {
                            // if it's an esri basemap don't add
                            found = true;
                        }
                        else {
                            portalBasemaps.forEach(function(basemap) {
                                if (basemap && basemap.portalItem && basemap.portalItem.title === view.map.basemap.title) {
                                    found = true;
                                }
                            });
                        }
                        if (!found) {
                            return [view.map.basemap, ...portalBasemaps]
                        } else {
                            return portalBasemaps;
                        }
                        // return [view.map.basemap, ...portalBasemaps]
                    }
                });

                const basemapGallery = new BasemapGallery({
                    view,
                    source: source//this.base.portal
                });

                const basemapGalleryExpand = new Expand({
                    view,
                    mode: "floating",
                    content: basemapGallery,
                    expandTooltip: i18n.map.basemapExpand.tooltip
                });
                view.ui.add(basemapGalleryExpand, { position: this.base.config.basemapsPosition, index: 1 });

            });
        }

        const homeWidget = new Home({ view });
        view.ui.add(homeWidget, { position: "top-left", index: 2 });

        // VIEW TYPE SPECIFIC //
        if (view.type === "2d") {
            // MapView //
            const compass = new Compass({ view });
            view.ui.add(compass, { position: "top-left", index: 5 });
        } else if (view.type === "3d" && this.base.config.spinGlobe) {
            // SceneView //
            this.initializeViewSpinTools(view as SceneView);
        }


        // INITIALIZE LAYER LIST //
        this.initializeLayerList(view);

        // RETURN THE VIEW //
        return view;
    }
    /**
     * INITIALIZE LAYER LIST WIDGET
     *  - REORDER, DETAILS, ZOOM TO, REMOVE
     *  - OPACITY SLIDER
     *  - LEGEND
     *
     * @param view
     */
    initializeLayerList(view: any) {
        view = (view && view.type === "2d") ? view as MapView : view as SceneView;
        // LAYERS PANEL //
        const layers_panel = domConstruct.create("div", { className: "panel panel-no-border panel-no-padding layer-panel" });
        const action_node = domConstruct.create("div", { className: "panel panel-no-border text-black padding-left-half padding-right-1 font-size-0" }, layers_panel);
        domConstruct.create("span", { innerHTML: i18n.map.layers_panel.innerHTML }, action_node);
        // Hiding remove all layers, hide all layers and show all layers based on holistic testing feedback
        // We'll review the UX for this and add this capability back at the next release. 
        //const actionTools = domConstruct.create("span", { className: "action-node hide" }, action_node);
        // REMOVE ALL LAYERS //
        /*const remove_layers_btn = domConstruct.create("button", {
            className: "btn btn-transparent btn-small icon-ui-close-circled icon-ui-flush esri-interactive right",
            title: i18n.map.remove_layers.title
        }, actionTools);
 
        remove_layers_btn.addEventListener("click", () => {
            view.map.layers.removeAll();
            this.displayItemDetails();
        });*/

        // SET LAYERS VISIBILITY //
        /* const show_layers_btn = domConstruct.create("button", {
             className: "btn btn-transparent btn-small icon-ui-checkbox-checked esri-interactive right",
             title: i18n.map.show_layers.title
         }, actionTools);
         show_layers_btn.addEventListener("click", () => {
             this.setAllLayersVisibility(true);
             this.displayItemDetails();
         });*/

        /* const hide_layers_btn = domConstruct.create("button", {
             className: "btn btn-transparent btn-small icon-ui-checkbox-unchecked esri-interactive right",
             title: i18n.map.hide_layers.title
         }, actionTools);
         hide_layers_btn.addEventListener("click", () => {
             this.setAllLayersVisibility(false);
             this.displayItemDetails();
         });*/
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
            }, opacity_node) as HTMLInputElement;
            opacity_input.addEventListener("input", () => {
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
            // only display reorder layer buttons when more than one layer is added to layer list 
            if (layerList.operationalItems.length > 1) {
                const reorder_up_node = domConstruct.create("button", {
                    className: "btn-link esri-icon-arrow-up",
                    title: i18n.map.move_layer_up.title
                }, reorder_node);
                const reorder_down_node = domConstruct.create("button", {
                    className: "btn-link esri-icon-arrow-down",
                    title: i18n.map.move_layer_down.title
                }, reorder_node);
                reorder_up_node.addEventListener("click", () => {
                    view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) + 1);
                });
                reorder_down_node.addEventListener("click", () => {
                    view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) - 1);
                });
            }

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
                title: i18n.map.zoom_to_layer.title,
                disabled: item.layer.type === "group" ? true : false // disable zoom for group layers
            }, tools_node);
            zoom_to_node.addEventListener("click", () => {
                view.goTo(item.layer.fullExtent);
            });

            // LAYER DETAILS //
            const info_node = domConstruct.create("button", {
                className: "btn-link icon-ui-description icon-ui-blue right",
                title: i18n.map.view_details.title
            }, tools_node);
            on(info_node, "click", () => {
                this.displayItemDetails(item.layer.portalItem);
                // open the panel if closed
                if (domClass.contains("item-info-container", "collapsed")) {
                    domClass.remove("item-info-container", "collapsed");
                }
            });

            return tools_node;
        };

        // CREATE LEGEND NODE //
        const createLegendNode = (item, parent_node) => {

            const legend_panel = domConstruct.create("div", { className: "legend-panel esri-widget" }, parent_node);

            const legend = new Legend({
                container: domConstruct.create("div", {}, legend_panel),
                view,
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

            legend_toggle_node.addEventListener("click", () => {
                domClass.toggle(legend_toggle_label, "hide");
                domClass.toggle(legend_toggle_node, "legend-toggle-hidden icon-ui-down icon-ui-right");
                domClass.toggle(legend.container, "hide");
            });
        };

        // LAYER LIST //
        const layerList = new LayerList({
            view,
            container: domConstruct.create("div", {}, layers_panel),
            listItemCreatedFunction: (evt) => {
                let item = evt.item;
                if (item.layer && item.layer.portalItem) {
                    // CREATE ITEM PANEL //
                    const panel_node = domConstruct.create("div", { className: "esri-widget" });

                    // LAYER TOOLS //
                    createToolsNode(item, panel_node);

                    // LAYER OPACITY //
                    createOpacityNode(item, panel_node);

                    // LEGEND //
                    if (item.layer.legendEnabled) {
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
            view,
            mode: "floating",
            content: layers_panel,
            iconNumber: 0,
            expandIconClass: "esri-icon-layers",
            expandTooltip: i18n.map.layerlist_expand.tooltip
        });
        view.ui.add(layerListExpand, { position: "top-right", index: 1 });

        // LAYER COUNT //
        view.map.layers.on("change", () => {
            layerListExpand.iconNumber = view.map.layers.length;
            //hide show layer (add,remove and clear) icons when layers are visible. 
            // view.map.layers.length > 0 ? domClass.remove(actionTools, "hide") : domClass.add(actionTools, "hide");
        });

        // SYNCHRONIZE LAYERLIST EXPANDS //
        layerListExpand.watch("expanded", (expanded) => {
            this.emit("layerlist-expanded", { expanded: expanded, source: layerListExpand });
        });
        this.on("layerlist-expanded", evt => {
            if ((evt.source !== layerListExpand) && (evt.expanded !== layerListExpand.expanded)) {
                layerListExpand.toggle();
            }
        });
    }
    initializeViewSpinTools(view: SceneView) {
        let spin_direction = "none";
        let spin_handle = null;
        let spin_step = 0.05;
        const spin_fps = 60;

        const _spin = () => {
            if (spin_direction !== "none") {
                const camera = view.camera.clone();

                // WHAT IS THE APPROPRIATE ZOOM LEVEL TO SWITCH BETWEEN LOCAL AND GLOBAL? //
                if (view.zoom > 9) {
                    // AT A 'LOCAL' SCALE WE CHANGE THE HEADING //
                    camera.heading += ((spin_direction === "right") ? spin_step : -spin_step);
                } else {
                    // AT A GLOBAL SCALE WE CHANGE THE LONGITUDE //
                    camera.position.longitude += ((spin_direction === "right") ? spin_step : -spin_step);
                    // MAINTAIN CURRENT HEADING OR FORCE UP //
                    camera.heading = always_up ? 0.0 : camera.heading;
                }
                spin_handle = view.goTo(camera, { animate: false }).then(() => {
                    if (spin_direction !== "none") {
                        setTimeout(() => {
                            requestAnimationFrame(_spin);
                        }, (1000 / spin_fps));
                    }
                });
            }
        };

        const enableSpin = (direction) => {
            spin_direction = direction;
            if (spin_direction !== "none") {
                requestAnimationFrame(_spin);
            } else {
                spin_handle && !spin_handle.isFulfilled() && spin_handle.cancel();
            }
        };

        const viewSpinNode = domConstruct.create("div", { className: "view-spin-node" }, view.root);
        const spinLeftBtn = domConstruct.create("button", { className: "btn btn-transparent spin-btn icon-ui-arrow-left-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_left.title }, viewSpinNode);
        const alwaysUpBtn = domConstruct.create("button", { id: "always-up-btn", className: "btn btn-transparent spin-btn icon-ui-compass icon-ui-flush font-size--1 esri-interactive", title: i18n.spin_tool.always_up.title }, viewSpinNode);
        const spinRightBtn = domConstruct.create("button", { className: "btn btn-transparent spin-btn icon-ui-arrow-right-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_right.title }, viewSpinNode);

        // SPIN LEFT //
        spinLeftBtn.addEventListener("click", () => {
            enableSpin("none");
            spinRightBtn.classList.remove("selected");
            spinLeftBtn.classList.toggle("selected");
            if (spinLeftBtn.classList.contains("selected")) {
                enableSpin("left");
            }
        });

        // SPIN RIGHT //
        spinRightBtn.addEventListener("click", () => {
            enableSpin("none");
            spinLeftBtn.classList.remove("selected");
            spinRightBtn.classList.toggle("selected");
            if (spinRightBtn.classList.contains("selected")) {
                enableSpin("right");
            }
        });
        // ALWAYS UP //
        let always_up = false;
        alwaysUpBtn.addEventListener("click", () => {
            alwaysUpBtn.classList.toggle("selected");
            always_up = alwaysUpBtn.classList.contains("selected");

        });
    }
    /**
     * SYNCHRONIZE VIEWS
     *
     * @param views_infos
     */
    initializeSynchronizedViews(views_infos) {
        // SYNC VIEW //
        const synchronizeView = (view, others) => {
            others = Array.isArray(others) ? others : [others];
            let viewpointWatchHandle;
            let viewStationaryHandle;
            let otherInteractHandlers;
            let scheduleId;

            const clear = () => {
                if (otherInteractHandlers) {
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
                if (!newValue) { return; }
                if (viewpointWatchHandle || scheduleId) { return; }

                if (!view.animation) {
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
                        if (value) { clear(); }
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
        synchronizeViews(Array.from(views_infos));
    }
    disableGalleryNavigation(overflow: boolean, navElements: HTMLCollection) {
        for (let i = 0; i < navElements.length; i++) {
            const elem = navElements[i];
            !overflow ? elem.classList.add("nav-hide") : elem.classList.remove("nav-hide");
        }
    }
    initializeItemListScroll() {
        // CONTENT CONTAINER //
        const content_container = document.getElementById("content-container-parent");
        const content_box = domGeom.getContentBox(content_container);
        const scrollLeftMax = (content_container.scrollWidth - content_box.w);
        // Check to see if we should show nav buttons or not 
        const navElements = document.getElementsByClassName("gallery-nav");
        this.disableGalleryNavigation(content_container.scrollWidth > content_container.offsetWidth, navElements);

        let resizeTimeout;
        window.addEventListener("resize", () => {
            // ignore resize events as long as an actualResizeHandler execution is in the queue
            if (!resizeTimeout) {
                resizeTimeout = setTimeout(() => {
                    resizeTimeout = null;
                    this.disableGalleryNavigation(content_container.scrollWidth > content_container.offsetWidth, navElements);
                    // The actualResizeHandler will execute at a rate of 15fps
                }, 66);
            }
        }, false);


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
                    if (scroll_options.auto && (content_container.scrollLeft <= 0)) {
                        scroll_options.direction = "RIGHT";
                    }
                    requestAnimationFrame(_scroll_items);
                    break;

                case "RIGHT":
                    domClass.remove("auto-scroll-left", "direction-selected");
                    domClass.add("auto-scroll-right", "direction-selected");

                    content_container.scrollLeft += scroll_options.distance;
                    if (scroll_options.auto && (content_container.scrollLeft >= scrollLeftMax)) {
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
        const auto_scroll = (direction?) => {
            if (direction) {
                scroll_options.direction = direction;
                scroll_options.distance = scroll_options.auto_distance;
                scroll_options.auto = true;
                _scroll_items();
                // remove dojo/on when IE11 isn't supported 
                // https://caniuse.com/#feat=once-event-listener
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
        on(document.getElementById("items-list-left"), touch.press, () => {
            scroll_options.direction = "LEFT";
            scroll_options.distance = scroll_options.manual_distance;
            scroll_options.auto = false;
            _scroll_items();
        });

        on(document.getElementById("items-list-left"), touch.release, () => {
            scroll_options.direction = "NONE";
            scroll_options.distance = scroll_options.manual_distance;
            scroll_options.auto = false;
        });
        // RIGHT //
        on(document.getElementById("items-list-right"), touch.press, () => {
            scroll_options.direction = "RIGHT";
            scroll_options.distance = scroll_options.manual_distance;
            scroll_options.auto = false;
            _scroll_items();
        });
        on(document.getElementById("items-list-right"), touch.release, () => {
            scroll_options.direction = "NONE";
            scroll_options.distance = scroll_options.manual_distance;
            scroll_options.auto = false;
        });
        if (this.base.config.autoNavScroll) {
            document.getElementById("auto-scroll-container").classList.remove("hide");
            // INITIATE AUTO SCROLL //
            document.getElementById("auto-scroll-left").addEventListener("click", () => {
                if (scroll_options.direction === "LEFT") {
                    auto_scroll();
                } else {
                    auto_scroll("LEFT");
                }
            });
            document.getElementById("auto-scroll-right").addEventListener("click", () => {
                if (scroll_options.direction === "RIGHT") {
                    auto_scroll();
                } else {
                    auto_scroll("RIGHT");
                }
            });
            // AUTO SCROLL ON STARTUP //
            if (this.base.config.autoScroll) {
                setTimeout(() => {
                    auto_scroll("RIGHT");
                }, 1500);
            }
            // RESET //
            document.getElementById("auto-scroll-reset").addEventListener("click", () => {
                auto_scroll();
                content_container.scrollLeft = 0;
            });

        }

        // MANUALLY SCROLL LIST //
        const content_list = document.getElementById("content-container");
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
    }
    /**
     * INITIALIZE GROUP CONTENT
     *
     * @param group_id
     */

    async initializeGroupContent(group_id) {
        // FIND GROUP //
        const groupResponse = await this.base.portal.queryGroups({ query: `id:${group_id}` });
        // DID WE FIND THE GROUP
        if (groupResponse.results.length > 0) {
            //CONFIGURED GROUP // 
            const portal_group = groupResponse.results[0];

            // INITIALIZE PANEL CONTENT AND GET FUNCTION TO DISPLAY ITEM DETAILS //
            if (!portal_group.description || this.base.config.description) {
                portal_group.description = this.base.config.description;
            }
            this.displayItemDetails = this.initializePanelContent(portal_group);
            // SEARCH FOR GROUP ITEMS //
            return this.getGroupItems(portal_group, 1).then(() => {
                // CREATE LAYER ITEM LIST SCROLL //
                this.initializeItemListScroll();
            });
        } else {
            // WE DIDN'T FIND THE GROUP, SO LET'S FORCE THE USER TO SIGN IN AND TRY AGAIN //
            // TODO: DO WE STILL NEED THIS?
            return this.initializeUserSignIn(true).then(() => {
                return this.initializeGroupContent(group_id);
            });
        }
    }
    /**
    * QUERY FOR LAYER ITEMS IN THE GROUP
    *  - ONLY ONE SEARCH SO MAXIMUM 100 ITEMS RETURNED
    *  - USES GROUP CONFIGURED SORT PARAMETERS
    *
    * @param portalGroup
    * @param start
    */
    getGroupItems(portalGroup, start) {
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
    }
    /**
     * CREATE A SCROLLABLE LIST OF LAYER ITEMS NODES //
     *
     * @param layer_items
     */
    displayLayerItems(layer_items) {
        // CREATE LAYER ITEM NODES //
        layer_items.forEach(layer_item => {
            // LAYER ITEM NODE //
            const item_node = domConstruct.create("li", {
                className: "content-item"
            }, "content-container");
            const thumbnail = layer_item.thumbnailUrl || "./assets/ago_downloaded.png";

            // THUMBNAIL NODE //
            domConstruct.create("img", {
                className: "content-item-img",
                src: thumbnail,
                alt: layer_item.title
            }, item_node);

            // ACTION NODE //
            const action_node = domConstruct.create("span", {
                className: "item-actions text-center text-white",
            }, item_node);

            // ADD BUTTON //
            const add_btn = domConstruct.create("button", {
                className: "item-action esri-icon-down btn btn-small btn-transparent",
                title: i18n.item.add_to_map.title,
            }, action_node);

            // ADD VISIBLE BUTTON //
            const add_visible_btn = domConstruct.create("button", {
                className: "item-action esri-icon-visible btn btn-small btn-transparent",
                title: i18n.item.add_to_map_only_visible.title
            }, action_node);

            // TITLE NODE - REPLACE UNDERSCORES SO TITLES WRAP //
            const title = layer_item.title ? layer_item.title.replace(/_/g, " ").trim() : "";

            const item_title_node = domConstruct.create("button", {
                className: "content-item-title btn btn-transparent avenir-demi font-size-0 esri-interactive icon-ui-description",
                innerHTML: title,
                title
            }, item_node);
            // Add ellipsis if title is too long
            if (title && title.length > 15) {
                window.$clamp(item_title_node, { clamp: 2, useNativeClamp: true });
            }


            // DISPLAY ITEM DETAILS //
            item_title_node.addEventListener("click", () => {
                this.displayItemDetails(layer_item);
                // open the panel if closed
                if (domClass.contains("item-info-container", "collapsed")) {
                    domClass.remove("item-info-container", "collapsed");
                }
            });
            // ADD LAYER //
            add_btn.addEventListener("click", () => {
                this.addItemToMap(layer_item);
                this.displayItemDetails(layer_item);
            });
            // ADD LAYER VISIBLE //
            add_visible_btn.addEventListener("click", () => {
                this.setAllLayersVisibility(false);
                this.addItemToMap(layer_item);
                this.displayItemDetails(layer_item);
            });

        });
    }
    /**
    * SET PANEL CONTENT TO LAYER ITEM OR GROUP
    *
    * @param portal_group
    * @returns {function(*=)}
    */
    initializePanelContent(portal_group) {
        // UPDATE THE PANEL CONTENT WITH INFORMATION ABOUT A LAYER ITEM OR THE CONFIGURED GROUP //
        const display_content = (item_or_group) => {
            if (item_or_group) {
                // IS ITEM OR GROUP //
                const type = (item_or_group.declaredClass === "esri.portal.PortalGroup") ? "group" : "item";
                domClass.toggle("content-reset-node", "hide", (type === "group"));
                // TITLE //
                const titleDiv = document.getElementById("content-title-label");
                titleDiv.innerHTML = item_or_group.title;
                titleDiv.title = item_or_group.snippet || item_or_group.title || "";

                // DETAILS LINK //
                const detailsLink = document.getElementById("content-details-link") as HTMLLinkElement;
                detailsLink.href = `${this.base.portal.url}/home/${type}.html?id=${item_or_group.id}`;
                // SCROLL DESCRIPTION PANEL TO THE TOP //
                document.getElementById("content-description-panel").scrollTop = 0;
                // DESCRIPTION //
                document.getElementById("content-description").innerHTML = item_or_group.description || ((type === "group") ? i18n.panel.missing_description_group : i18n.panel.missing_description_item);
            }
        };
        // RESET PANEL CONTENT //
        document.getElementById("content-reset-node").addEventListener("click", () => {
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

    }

    /**
    * ADD ITEM TO MAP
    *  - IF THE LAYER IS ALREADY IN THE MAP, JUST MAKE SURE IT'S VISIBLE
    *
    * @param map
    */
    _addItemToMap(map) {
        return (item) => {
            // IS LAYER ALREADY IN THE MAP //
            let item_layer = map.layers.find(layer => {
                return (layer.portalItem.id === item.id);
            });
            if (item_layer) {
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
                        if (removed_layer.id === item_layer.id) {
                            this.displayItemDetails();
                        }
                    });

                }).otherwise(error => {
                    this.addLayerNotification(item, error);
                });
            }

        };
    }

    /**
     * MAKE SURE TO RETURN A LOADED PortalItem
     *
     * @param itemLike
     * @returns {Promise<PortalItem>}
     * @private
     */

    _getItem(itemLike) {
        if (itemLike.declaredClass === "esri.portal.PortalItem") {
            return itemLike.loaded ? promiseUtils.resolve(itemLike) : itemLike.load();
        } else {
            const item = new PortalItem({ id: itemLike.id });
            return item.load();
        }
    }
    /**
     * GET THE LAYER FROM THE PortalItem
     *  - APPLY OVERRIDES IF AVAILABLE
     *
     * @param itemLike
     * @returns {*}
     */
    getItemLayer(itemLike) {
        // GET FULL ITEM //
        return this._getItem(itemLike).then((item) => {
            // IS ITEM A LAYER //
            if (item.isLayer) {
                // CREATE LAYER FROM ITEM //
                return Layer.fromPortalItem({ portalItem: item }).then((layer) => {
                    // LOAD LAYER //
                    return layer.load().then(() => {
                        // FETCH ITEM OVERRIDES //
                        return item.fetchData().then((item_data) => {
                            // APPLY IF LAYER HAVE ANY OVERRIDES //
                            if (item_data != null) {
                                // VISIBILITY //
                                if (item_data.hasOwnProperty("visibility")) {
                                    layer.visible = item_data.visibility;
                                }
                                // OPACITY //
                                if (item_data.hasOwnProperty("opacity")) {
                                    layer.opacity = item_data.opacity;
                                }
                                switch (layer.type) {
                                    case "map-image":
                                        // SUBLAYER VISIBILITY - 4.8 //
                                        if (item_data.hasOwnProperty("visibleLayers")) {
                                            const mapImageLayer = layer as esri.MapImageLayer;
                                            const visible_layers = item_data.visibleLayers || [];
                                            mapImageLayer.allSublayers.forEach(sublayer => {
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
                        return promiseUtils.reject(new Error(layer.loadError.toString()));
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

    }
    /**
     * ADD A LAYER ITEM NOTIFICATION
     *
     * @param layer_item
     * @param error
     */
    addLayerNotification(layer_item, error?) {
        const notificationsNode = document.getElementById("notifications-node");

        const alertNode = domConstruct.create("div", {
            className: error ? CSS.NOTIFICATION_TYPE.ERROR : CSS.NOTIFICATION_TYPE.SUCCESS
        }, notificationsNode);

        const alertCloseNode = domConstruct.create("div", { className: "inline-block esri-interactive icon-ui-close margin-left-1 right" }, alertNode);
        on.once(alertCloseNode, "click", () => {
            domConstruct.destroy(alertNode);
        });
        domConstruct.create("div", { innerHTML: error ? error.message : lang.replace(i18n.notifications.layer_added_template, layer_item) }, alertNode);

        if (error != null) {
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
    }

    /**
     * OPEN THE MAP VIEWER USING THE CURRENT MAP SETTINGS AND LAYERS
     *  - https://doc.arcgis.com/en/arcgis-online/reference/use-url-parameters.htm
     *
     * @param map_infos
     */
    initializeCreateOnlineMap(map_infos) {
        document.getElementById("create-map-btn").addEventListener("click", () => {
            // CURRENT VIEW //
            let display_type = this.base.config.displayMode;
            if (this.base.config.displayMode === "both") {
                const inputElement = document.getElementById("display-type-input") as HTMLInputElement;
                display_type = !inputElement.checked ? "2d" : "3d";
            }
            // TODO handle web scene url params and also different projections
            let view;
            map_infos.views.forEach((info) => {
                if (info.type === display_type) {
                    view = info;
                }
            });
            if (view) {
                const { x, y } = view.center;
                const { spatialReference } = view;
                const centerPoint = new Point({
                    x,
                    y,
                    spatialReference
                });
                this.processPoint(centerPoint).then((point) => {
                    if (point) {
                        let urlParams;
                        if (display_type === "3d") {
                            const { camera } = view as SceneView;
                            //'viewpoint=cam:posx,posy,posz,wkid;heading,tilt'
                            urlParams = `viewpoint=cam:${camera.position.x},${camera.position.y},${camera.position.z},${camera.position.spatialReference.wkid};${camera.heading},${camera.tilt}`;

                        } else {
                            const { longitude, latitude } = point;
                            const { zoom } = view;
                            urlParams = `center=${longitude},${latitude}&level=${zoom.toFixed(0)}`
                        }
                        if (map_infos.map.basemap.baseLayers.length > 0) {
                            // ASSUMES THERE'S ONLY ONE //
                            urlParams += `&basemapUrl=${map_infos.map.basemap.baseLayers.getItemAt(0).url}`;
                        }
                        // REFERENCE URL //
                        if (map_infos.map.basemap.referenceLayers.length > 0) {
                            // ASSUMES THERE'S ONLY ONE //
                            urlParams += `&basemapReferenceUrl=${map_infos.map.basemap.referenceLayers.getItemAt(0).url}`;
                        }
                        // LAYERS //
                        const layer_ids = map_infos.map.layers.map(layer => {
                            return layer.portalItem.id;
                        });
                        if (layer_ids) {
                            urlParams += `&layers=${layer_ids.join(",")}`;
                        }
                        const viewerUrl = `${this.base.portal.url}/home/${display_type === "3d" ? "webscene" : "webmap"}/viewer.html`;
                        window.open(`${viewerUrl}?${urlParams}`);
                    } else {
                        // TODO error handling
                        console.log("Unable to project point");
                    }

                });

            }

        });
    }

    processPoint(point) {

        const { isWGS84, isWebMercator } = point.spatialReference;
        // If spatial reference is WGS84 or Web Mercator, use longitude/latitude values to generate the share URL parameters
        if (!isWGS84 || !isWebMercator) {
            return promiseUtils.resolve(point);
        }
        requireUtils.when(require, [
            "esri/geometry/projection",
            "esri/geometry/SpatialReference"
        ]).then(([
            projection,
            SpatialReference
        ]) => {
            const outputSpatialReference = new SpatialReference({
                wkid: 4326
            });
            return projection.load().then(() => {
                if (!projection.isSupported) {
                    // no client side projection
                    return (promiseUtils.resolve(new Point({
                        x: null,
                        y: null
                    })));
                }
                return promiseUtils.resolve(projection.project(point, outputSpatialReference));
            });

        });

        return promiseUtils.resolve();
    }
}

export = Main;
