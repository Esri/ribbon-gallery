var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "dojo/i18n!./nls/resources", "esri/core/Evented", "esri/core/promiseUtils", "esri/core/watchUtils", "esri/core/requireUtils", "esri/portal/Portal", "esri/portal/PortalItem", "esri/layers/Layer", "esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/widgets/Expand", "esri/widgets/Home", "esri/widgets/Compass", "esri/widgets/Legend", "esri/widgets/LayerList", "esri/identity/IdentityManager", "dojo/dom-class", "dojo/dom-geometry", "dojo/dom-construct", "dojo/touch", "dojo/on", "dojo/_base/lang", "ApplicationBase/support/domHelper"], function (require, exports, i18n, Evented, promiseUtils, watchUtils, requireUtils, Portal, PortalItem, Layer, Map, MapView, SceneView, Expand, Home, Compass, Legend, LayerList, IdentityManager, domClass, domGeom, domConstruct, touch, on, lang, domHelper_1) {
    "use strict";
    var CSS = {
        loading: "configurable-application--loading",
        NOTIFICATION_TYPE: {
            MESSAGE: "alert alert-blue animate-in-up is-active inline-block",
            SUCCESS: "alert alert-green animate-in-up is-active inline-block",
            WARNING: "alert alert-yellow animate-in-up is-active inline-block",
            ERROR: "alert alert-red animate-in-up is-active inline-block"
        }
    };
    var Main = /** @class */ (function (_super) {
        __extends(Main, _super);
        function Main() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            //----------------------------------
            //  ApplicationBase
            //----------------------------------
            _this.base = null;
            return _this;
        }
        //--------------------------------------------------------------------------
        //
        //  Public Methods
        //
        //--------------------------------------------------------------------------
        Main.prototype.init = function (base) {
            var _this = this;
            if (!base) {
                console.error("ApplicationBase is not defined");
                return;
            }
            // Calcite needed for sign-in dropdown experi
            window.calcite.init();
            this.importPolyfills();
            this.base = base;
            var config = base.config;
            // LOCALE AND DIRECTION //
            domHelper_1.setPageLocale(base.locale);
            domHelper_1.setPageDirection(base.direction);
            // LOCALIZED DEFAULT UI COMPONENTS //
            Object.keys(i18n.ui).forEach(function (node_id) {
                var ui_component = document.getElementById(node_id);
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
            domHelper_1.setPageTitle(config.title);
            document.getElementById("app-title-node").innerHTML = config.title;
            // USER SIGN IN // 
            return this.initializeUserSignIn().always(function () {
                // CREATE MAP //
                _this.createMap().then(function (map_infos) {
                    // ADD ITEM TO MAP //
                    _this.addItemToMap = _this._addItemToMap(map_infos.map);
                    // SYNC VIEWS //
                    _this.initializeSynchronizedViews(map_infos.views);
                    // VIEW TYPE SWITCH //
                    _this.initializeViewTypeSwitch(map_infos.views);
                    // INITIALIZE CONTENT //
                    _this.initializeGroupContent(_this.base.config.group);
                    // INITIALIZE CREATE MAP //
                    _this.initializeCreateOnlineMap(map_infos);
                    // REMOVE LOADING //
                    document.body.classList.remove(CSS.loading);
                });
            });
        };
        Main.prototype.importPolyfills = function () {
            var promises = [];
            if (!Array.from) {
                promises.push(new Promise(function (resolve_1, reject_1) { require(["app/polyfills/array.from.js"], resolve_1, reject_1); }));
            }
            return Promise.all(promises);
        };
        /**
         * SWITCH VIEW TYPES BETWEEN MAP VIEW AND SCENE VIEW
         *
         * @param views
         */
        Main.prototype.initializeViewTypeSwitch = function (views) {
            var _this = this;
            // DISPLAY TYPE SWITCH //
            var display_switch = document.getElementById("display-type-input");
            on(display_switch, "change", function () {
                var view_type = display_switch.checked ? "3d" : "2d";
                var arrayViews = [views.get("3d"), views.get("2d")];
                arrayViews.forEach(function (view) {
                    domClass.toggle(view.container, "visually-hidden", (view.type !== view_type));
                });
                _this.emit("view-type-change", { type: view_type });
            });
            // INITIALLY HIDE THE 3D VIEW //
            domClass.add(views.get("3d").container, "visually-hidden");
        };
        /**
         * INITIALIZE USER SIGN IN
         *
         * @returns {*}
         */
        Main.prototype.initializeUserSignIn = function (force_sign_in) {
            var _this = this;
            IdentityManager.useSignInPage = false;
            var checkSignInStatus = function () {
                return IdentityManager.checkSignInStatus(_this.base.portal.url).then(userSignIn);
            };
            IdentityManager.on("credential-create", checkSignInStatus);
            IdentityManager.on("credentials-destroy", checkSignInStatus);
            // SIGN IN NODE //
            var signInNode = document.getElementById("sign-in-node");
            var userNode = document.getElementById("user-node");
            // UPDATE UI //
            var updateSignInUI = function () {
                if (_this.base.portal.user) {
                    document.getElementById("user-firstname-node").innerHTML = _this.base.portal.user.fullName.split(" ")[0];
                    document.getElementById("user-fullname-node").innerHTML = _this.base.portal.user.fullName;
                    document.getElementById("username-node").innerHTML = _this.base.portal.user.username;
                    if (_this.base.portal.user.thumbnailUrl) {
                        var thumbnail = document.getElementById("user-thumb-node");
                        thumbnail.src = _this.base.portal.user.thumbnailUrl;
                    }
                    domClass.add(signInNode, "hide");
                    domClass.remove(userNode, "hide");
                }
                else {
                    domClass.remove(signInNode, "hide");
                    domClass.add(userNode, "hide");
                }
                return promiseUtils.resolve();
            };
            // SIGN IN //
            var userSignIn = function () {
                _this.base.portal = new Portal({ url: _this.base.config.portalUrl, authMode: "immediate" });
                return _this.base.portal.load().then(function () {
                    return updateSignInUI();
                }).otherwise(console.warn);
            };
            // SIGN OUT //
            var userSignOut = function () {
                IdentityManager.destroyCredentials();
                _this.base.portal = new Portal({ url: _this.base.config.portalUrl });
                _this.base.portal.load().then(function () {
                    _this.base.portal.user = null;
                    return updateSignInUI();
                }).otherwise(console.warn);
            };
            // USER SIGN IN //
            signInNode.addEventListener("click", userSignIn);
            // SIGN OUT NODE //
            var signOutNode = document.getElementById("sign-out-node");
            if (signOutNode) {
                signOutNode.addEventListener("click", userSignOut);
            }
            return force_sign_in ? userSignIn() : checkSignInStatus();
        };
        /**
         * CREATE A MAP, MAP VIEW, AND SCENE VIEW
         *
         * @returns {Promise}
         */
        Main.prototype.createMap = function () {
            var map = new Map({
                basemap: this.base.config.usePortalBasemap ? this.base.portal.defaultBasemap : { portalItem: { id: this.base.config.defaultBasemapId } },
                ground: "world-elevation"
            });
            // SET VISIBILITY OF ALL MAP LAYERS //
            this.setAllLayersVisibility = function (visible) {
                map.layers.forEach(function (layer) {
                    layer.visible = visible;
                });
            };
            // SCENE VIEW //
            var createSceneView = this.createView(map, "3d", "scene-node");
            // MAP VIEW //
            var createMapView = this.createView(map, "2d", "map-node");
            // RETURN VIEWS WHEN CREATED //
            return promiseUtils.eachAlways([createMapView, createSceneView]).then(function (createViewsResults) {
                // RETURN THE MAP AND VIEWS //
                return createViewsResults.reduce(function (map_info, createViewsResult) {
                    map_info.views.set(createViewsResult.value.type, createViewsResult.value);
                    return map_info;
                }, { map: map, views: new Map() });
            });
        };
        /**
        * CREATE A MAP OR SCENE VIEW
        *
        * @param map
        * @param type
        * @param container_id
        * @returns {*}
        */
        Main.prototype.createView = function (map, type, container_id) {
            return __awaiter(this, void 0, void 0, function () {
                var EARTH_RADIUS, view_settings, view, error_1, collapse, left_container, panelToggleBtn, up_container, listToggleBtn, updating_node, homeWidget, compass;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            EARTH_RADIUS = 6371000;
                            view_settings = {
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
                            view = (type === "2d") ? new MapView(view_settings) : new SceneView(view_settings);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, view.when()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            // TODO handle disabling 3d for browsers 
                            // that don't support web gl
                            console.log("Error", error_1);
                            return [3 /*break*/, 4];
                        case 4:
                            collapse = (view.widthBreakpoint === "xsmall") ? true : false;
                            left_container = document.getElementById("item-info-container");
                            panelToggleBtn = domConstruct.create("button", {
                                className: "panel-toggle-left btn btn-transparent icon-ui-flush font-size-1 " + (collapse ? "icon-ui-right-triangle-arrow" : "icon-ui-left-triangle-arrow"),
                                title: i18n.map.left_toggle.title
                            }, view.root);
                            panelToggleBtn.addEventListener("click", function () {
                                // TOGGLE PANEL TOGGLE BTNS //
                                domClass.toggle(panelToggleBtn, "icon-ui-left-triangle-arrow icon-ui-right-triangle-arrow");
                                // TOGGLE VISIBILITY OF CLOSABLE PANELS //
                                domClass.toggle(left_container, "collapsed");
                            });
                            up_container = document.getElementById("items-list-panel");
                            listToggleBtn = domConstruct.create("button", {
                                className: "panel-toggle-up btn btn-transparent icon-ui-flush font-size-1 " + (collapse ? "icon-ui-down-arrow" : "icon-ui-up-arrow"),
                                title: i18n.map.up_toggle.title
                            }, view.root);
                            if (collapse) {
                                up_container.classList.add("collapsed");
                                left_container.classList.add("collapsed");
                            }
                            listToggleBtn.addEventListener("click", function () {
                                domClass.toggle(listToggleBtn, "icon-ui-up-arrow icon-ui-down-arrow");
                                // TOGGLE VISIBILITY OF CLOSABLE PANELS //
                                up_container.classList.toggle("collapsed");
                                document.getElementById("auto-scroll-container").classList.toggle("collapsed");
                            });
                            updating_node = domConstruct.create("div", { className: "view-loading-node loader text-center padding-leader-0 padding-trailer-0" });
                            updating_node.innerHTML = "<div class=\"loader-bars\"></div><div class=\"loader-text font-size--3\">" + i18n.notifications.updating + " ...</div>";
                            view.ui.add(updating_node, "bottom-right");
                            watchUtils.init(view, "updating", function (updating) {
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
                            // Do we want any of these to be options? If so we 
                            // can conditionally load. If not just switch out to 
                            // import 
                            if (this.base.config.search) {
                                requireUtils.when(require, [
                                    "esri/widgets/Search"
                                ]).then(function (_a) {
                                    var Search = _a[0];
                                    var search = new Search({ view: view, searchTerm: _this.base.config.searchTerm || "" });
                                    var searchExpand = new Expand({
                                        view: view,
                                        mode: "floating",
                                        content: search
                                    });
                                    view.ui.add(searchExpand, { position: _this.base.config.searchPosition, index: 0 });
                                });
                            }
                            if (this.base.config.basemaps) {
                                requireUtils.when(require, [
                                    "esri/widgets/BasemapGallery"
                                ]).then(function (_a) {
                                    var BasemapGallery = _a[0];
                                    var basemapGallery = new BasemapGallery({
                                        view: view,
                                        source: _this.base.portal
                                    });
                                    var basemapGalleryExpand = new Expand({
                                        view: view,
                                        content: basemapGallery,
                                        expandTooltip: i18n.map.basemapExpand.tooltip
                                    });
                                    view.ui.add(basemapGalleryExpand, { position: _this.base.config.basemapsPosition, index: 1 });
                                });
                            }
                            homeWidget = new Home({ view: view });
                            view.ui.add(homeWidget, { position: "top-left", index: 2 });
                            // VIEW TYPE SPECIFIC //
                            if (view.type === "2d") {
                                compass = new Compass({ view: view });
                                view.ui.add(compass, { position: "top-left", index: 5 });
                            }
                            else if (view.type === "3d" && this.base.config.spinGlobe) {
                                // SceneView //
                                this.initializeViewSpinTools(view);
                            }
                            // INITIALIZE LAYER LIST //
                            this.initializeLayerList(view);
                            // RETURN THE VIEW //
                            return [2 /*return*/, view];
                    }
                });
            });
        };
        /**
         * INITIALIZE LAYER LIST WIDGET
         *  - REORDER, DETAILS, ZOOM TO, REMOVE
         *  - OPACITY SLIDER
         *  - LEGEND
         *
         * @param view
         */
        Main.prototype.initializeLayerList = function (view) {
            var _this = this;
            view = (view && view.type === "2d") ? view : view;
            // LAYERS PANEL //
            var layers_panel = domConstruct.create("div", { className: "panel panel-no-padding" });
            var action_node = domConstruct.create("div", { className: "panel panel-dark-blue panel-no-padding padding-left-half padding-right-1 font-size-0" }, layers_panel);
            domConstruct.create("span", { innerHTML: i18n.map.layers_panel.innerHTML }, action_node);
            var actionTools = domConstruct.create("span", { className: "action-node hide" }, action_node);
            // REMOVE ALL LAYERS //
            var remove_layers_btn = domConstruct.create("button", {
                className: "btn btn-transparent btn-small icon-ui-close-circled icon-ui-flush esri-interactive right",
                title: i18n.map.remove_layers.title
            }, actionTools);
            remove_layers_btn.addEventListener("click", function () {
                view.map.layers.removeAll();
                _this.displayItemDetails();
            });
            // SET LAYERS VISIBILITY //
            var show_layers_btn = domConstruct.create("button", {
                className: "btn btn-transparent btn-small icon-ui-checkbox-checked esri-interactive right",
                title: i18n.map.show_layers.title
            }, actionTools);
            show_layers_btn.addEventListener("click", function () {
                _this.setAllLayersVisibility(true);
                _this.displayItemDetails();
            });
            var hide_layers_btn = domConstruct.create("button", {
                className: "btn btn-transparent btn-small icon-ui-checkbox-unchecked esri-interactive right",
                title: i18n.map.hide_layers.title
            }, actionTools);
            hide_layers_btn.addEventListener("click", function () {
                _this.setAllLayersVisibility(false);
                _this.displayItemDetails();
            });
            // CREATE OPACITY NODE //
            var createOpacityNode = function (item, parent_node) {
                var opacity_node = domConstruct.create("div", {
                    className: "layer-opacity-node esri-widget",
                    title: i18n.map.layer_opacity.title
                }, parent_node);
                var opacity_input = domConstruct.create("input", {
                    className: "opacity-input",
                    type: "range", min: 0, max: 1.0, step: 0.01,
                    value: item.layer.opacity
                }, opacity_node);
                opacity_input.addEventListener("input", function () {
                    item.layer.opacity = opacity_input.valueAsNumber;
                });
                item.layer.watch("opacity", function (opacity) {
                    opacity_input.valueAsNumber = opacity;
                });
                opacity_input.valueAsNumber = item.layer.opacity;
                return opacity_node;
            };
            // CREATE TOOLS NODE //
            var createToolsNode = function (item, parent_node) {
                // TOOLS NODE //
                var tools_node = domConstruct.create("div", { className: "esri-widget" }, parent_node, "first");
                // REORDER //
                var reorder_node = domConstruct.create("div", { className: "inline-block" }, tools_node);
                var reorder_up_node = domConstruct.create("button", {
                    className: "btn-link esri-icon-arrow-up",
                    title: i18n.map.move_layer_up.title
                }, reorder_node);
                var reorder_down_node = domConstruct.create("button", {
                    className: "btn-link esri-icon-arrow-down",
                    title: i18n.map.move_layer_down.title
                }, reorder_node);
                reorder_up_node.addEventListener("click", function () {
                    view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) + 1);
                });
                reorder_down_node.addEventListener("click", function () {
                    view.map.reorder(item.layer, view.map.layers.indexOf(item.layer) - 1);
                });
                // REMOVE LAYER //
                var remove_layer_node = domConstruct.create("button", {
                    className: "btn-link icon-ui-close right",
                    title: i18n.map.remove_layer.title
                }, tools_node);
                on.once(remove_layer_node, "click", function () {
                    view.map.remove(item.layer);
                    _this.emit("layer-removed", item.layer);
                });
                // ZOOM TO //
                var zoom_to_node = domConstruct.create("button", {
                    className: "btn-link icon-ui-zoom-in-magnifying-glass right",
                    title: i18n.map.zoom_to_layer.title
                }, tools_node);
                zoom_to_node.addEventListener("click", function () {
                    view.goTo(item.layer.fullExtent);
                });
                // LAYER DETAILS //
                var info_node = domConstruct.create("button", {
                    className: "btn-link icon-ui-description icon-ui-blue right",
                    title: i18n.map.view_details.title
                }, tools_node);
                on(info_node, "click", function () {
                    _this.displayItemDetails(item.layer.portalItem);
                });
                return tools_node;
            };
            // CREATE LEGEND NODE //
            var createLegendNode = function (item, parent_node) {
                var legend_panel = domConstruct.create("div", { className: "legend-panel esri-widget" }, parent_node);
                var legend = new Legend({
                    container: domConstruct.create("div", {}, legend_panel),
                    view: view,
                    layerInfos: [{ layer: item.layer }]
                });
                var legend_toggle_node = domConstruct.create("button", {
                    className: "legend-toggle btn-link icon-ui-down",
                    title: i18n.map.legend_toggle.title
                }, legend_panel);
                var legend_toggle_label = domConstruct.create("div", {
                    className: "font-size--2 inline-block hide",
                    innerHTML: i18n.map.legend_label.innerHTML
                }, legend_toggle_node);
                legend_toggle_node.addEventListener("click", function () {
                    domClass.toggle(legend_toggle_label, "hide");
                    domClass.toggle(legend_toggle_node, "legend-toggle-hidden icon-ui-down icon-ui-right");
                    domClass.toggle(legend.container, "hide");
                });
            };
            // LAYER LIST //
            var layerList = new LayerList({
                view: view,
                container: domConstruct.create("div", {}, layers_panel),
                listItemCreatedFunction: function (evt) {
                    var item = evt.item;
                    if (item.layer && item.layer.portalItem) {
                        // CREATE ITEM PANEL //
                        var panel_node = domConstruct.create("div", { className: "esri-widget" });
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
            var layerListExpand = new Expand({
                view: view,
                content: layers_panel,
                mode: "floating",
                iconNumber: 0,
                expandIconClass: "esri-icon-layers",
                expandTooltip: i18n.map.layerlist_expand.tooltip
            });
            view.ui.add(layerListExpand, { position: "top-right", index: 1 });
            // LAYER COUNT //
            view.map.layers.on("change", function () {
                layerListExpand.iconNumber = view.map.layers.length;
                //hide show layer (add,remove and clear) icons when layers are visible. 
                view.map.layers.length > 0 ? domClass.remove(actionTools, "hide") : domClass.add(actionTools, "hide");
            });
            // SYNCHRONIZE LAYERLIST EXPANDS //
            layerListExpand.watch("expanded", function (expanded) {
                _this.emit("layerlist-expanded", { expanded: expanded, source: layerListExpand });
            });
            this.on("layerlist-expanded", function (evt) {
                if ((evt.source !== layerListExpand) && (evt.expanded !== layerListExpand.expanded)) {
                    layerListExpand.toggle();
                }
            });
        };
        Main.prototype.initializeViewSpinTools = function (view) {
            var spin_direction = "none";
            var spin_handle = null;
            var spin_step = 0.05;
            var spin_fps = 60;
            var _spin = function () {
                if (spin_direction !== "none") {
                    var camera = view.camera.clone();
                    // WHAT IS THE APPROPRIATE ZOOM LEVEL TO SWITCH BETWEEN LOCAL AND GLOBAL? //
                    if (view.zoom > 9) {
                        // AT A 'LOCAL' SCALE WE CHANGE THE HEADING //
                        camera.heading += ((spin_direction === "right") ? spin_step : -spin_step);
                    }
                    else {
                        // AT A GLOBAL SCALE WE CHANGE THE LONGITUDE //
                        camera.position.longitude += ((spin_direction === "right") ? spin_step : -spin_step);
                        // MAINTAIN CURRENT HEADING OR FORCE UP //
                        camera.heading = always_up ? 0.0 : camera.heading;
                    }
                    spin_handle = view.goTo(camera, { animate: false }).then(function () {
                        if (spin_direction !== "none") {
                            setTimeout(function () {
                                requestAnimationFrame(_spin);
                            }, (1000 / spin_fps));
                        }
                    });
                }
            };
            var enableSpin = function (direction) {
                spin_direction = direction;
                if (spin_direction !== "none") {
                    requestAnimationFrame(_spin);
                }
                else {
                    spin_handle && !spin_handle.isFulfilled() && spin_handle.cancel();
                }
            };
            var viewSpinNode = domConstruct.create("div", { className: "view-spin-node" }, view.root);
            var spinLeftBtn = domConstruct.create("button", { className: "btn btn-transparent spin-btn icon-ui-arrow-left-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_left.title }, viewSpinNode);
            var alwaysUpBtn = domConstruct.create("button", { id: "always-up-btn", className: "btn btn-transparent spin-btn icon-ui-compass icon-ui-flush font-size--1 esri-interactive", title: i18n.spin_tool.always_up.title }, viewSpinNode);
            var spinRightBtn = domConstruct.create("button", { className: "btn btn-transparent spin-btn icon-ui-arrow-right-circled icon-ui-flush font-size-2 esri-interactive", title: i18n.spin_tool.spin_right.title }, viewSpinNode);
            // SPIN LEFT //
            spinLeftBtn.addEventListener("click", function () {
                enableSpin("none");
                spinRightBtn.classList.remove("selected");
                spinLeftBtn.classList.toggle("selected");
                if (spinLeftBtn.classList.contains("selected")) {
                    enableSpin("left");
                }
            });
            // SPIN RIGHT //
            spinRightBtn.addEventListener("click", function () {
                enableSpin("none");
                spinLeftBtn.classList.remove("selected");
                spinRightBtn.classList.toggle("selected");
                if (spinRightBtn.classList.contains("selected")) {
                    enableSpin("right");
                }
            });
            // ALWAYS UP //
            var always_up = false;
            alwaysUpBtn.addEventListener("click", function () {
                alwaysUpBtn.classList.toggle("selected");
                always_up = alwaysUpBtn.classList.contains("selected");
            });
        };
        /**
         * SYNCHRONIZE VIEWS
         *
         * @param views_infos
         */
        Main.prototype.initializeSynchronizedViews = function (views_infos) {
            var _this = this;
            // SYNC VIEW //
            var synchronizeView = function (view, others) {
                others = Array.isArray(others) ? others : [others];
                var viewpointWatchHandle;
                var viewStationaryHandle;
                var otherInteractHandlers;
                var scheduleId;
                var clear = function () {
                    if (otherInteractHandlers) {
                        otherInteractHandlers.forEach(function (handle) {
                            handle.remove();
                        });
                    }
                    viewpointWatchHandle && viewpointWatchHandle.remove();
                    viewStationaryHandle && viewStationaryHandle.remove();
                    scheduleId && clearTimeout(scheduleId);
                    otherInteractHandlers = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
                };
                var interactWatcher = view.watch('interacting,animation', function (newValue) {
                    if (!newValue) {
                        return;
                    }
                    if (viewpointWatchHandle || scheduleId) {
                        return;
                    }
                    if (!view.animation) {
                        others.forEach(function (otherView) {
                            otherView.viewpoint = view.viewpoint;
                        });
                    }
                    // start updating the other views at the next frame
                    scheduleId = setTimeout(function () {
                        scheduleId = null;
                        viewpointWatchHandle = view.watch('viewpoint', function (newValue) {
                            others.forEach(function (otherView) {
                                otherView.viewpoint = newValue;
                            });
                        });
                    }, 0);
                    // stop as soon as another view starts interacting, like if the user starts panning
                    otherInteractHandlers = others.map(function (otherView) {
                        return watchUtils.watch(otherView, 'interacting,animation', function (value) {
                            if (value) {
                                clear();
                            }
                        });
                    });
                    // or stop when the view is stationary again
                    viewStationaryHandle = watchUtils.whenTrue(view, 'stationary', clear);
                });
                return {
                    remove: function () {
                        _this.remove = function () {
                        };
                        clear();
                        interactWatcher.remove();
                    }
                };
            };
            // SYNC VIEWS //
            var synchronizeViews = function (views) {
                var handles = views.map(function (view, idx, views) {
                    var others = views.concat();
                    others.splice(idx, 1);
                    return synchronizeView(view, others);
                });
                return {
                    remove: function () {
                        _this.remove = function () {
                        };
                        handles.forEach(function (h) {
                            h.remove();
                        });
                        handles = null;
                    }
                };
            };
            // INIT SYNC VIEWS //
            synchronizeViews(Array.from(views_infos));
        };
        Main.prototype.initializeItemListScroll = function () {
            // CONTENT CONTAINER //
            var content_container = document.getElementById("content-container-parent");
            var content_box = domGeom.getContentBox(content_container);
            var scrollLeftMax = (content_container.scrollWidth - content_box.w);
            // SCROLL OPTIONS //
            var scroll_options = {
                auto: false,
                direction: "NONE",
                distance: 3,
                auto_distance: 1,
                manual_distance: 3,
                step_distance: 200
            };
            // SCROLL ITEMS //
            var _scroll_items = function () {
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
            var auto_scroll = function (direction) {
                if (direction) {
                    scroll_options.direction = direction;
                    scroll_options.distance = scroll_options.auto_distance;
                    scroll_options.auto = true;
                    _scroll_items();
                    // remove dojo/on when IE11 isn't supported 
                    // https://caniuse.com/#feat=once-event-listener
                    on.once(content_container, "click", function () {
                        auto_scroll();
                    });
                }
                else {
                    scroll_options.direction = "NONE";
                    scroll_options.distance = scroll_options.manual_distance;
                    scroll_options.auto = false;
                }
            };
            // LEFT // 
            on(document.getElementById("items-list-left"), touch.press, function () {
                scroll_options.direction = "LEFT";
                scroll_options.distance = scroll_options.manual_distance;
                scroll_options.auto = false;
                _scroll_items();
            });
            on(document.getElementById("items-list-left"), touch.release, function () {
                scroll_options.direction = "NONE";
                scroll_options.distance = scroll_options.manual_distance;
                scroll_options.auto = false;
            });
            // RIGHT //
            on(document.getElementById("items-list-right"), touch.press, function () {
                scroll_options.direction = "RIGHT";
                scroll_options.distance = scroll_options.manual_distance;
                scroll_options.auto = false;
                _scroll_items();
            });
            on(document.getElementById("items-list-right"), touch.release, function () {
                scroll_options.direction = "NONE";
                scroll_options.distance = scroll_options.manual_distance;
                scroll_options.auto = false;
            });
            // INITIATE AUTO SCROLL //
            document.getElementById("auto-scroll-left").addEventListener("click", function () {
                if (scroll_options.direction === "LEFT") {
                    auto_scroll();
                }
                else {
                    auto_scroll("LEFT");
                }
            });
            document.getElementById("auto-scroll-right").addEventListener("click", function () {
                if (scroll_options.direction === "RIGHT") {
                    auto_scroll();
                }
                else {
                    auto_scroll("RIGHT");
                }
            });
            // AUTO SCROLL ON STARTUP //
            if (this.base.config.autoScroll) {
                setTimeout(function () {
                    auto_scroll("RIGHT");
                }, 1500);
            }
            // RESET //
            document.getElementById("auto-scroll-reset").addEventListener("click", function () {
                auto_scroll();
                content_container.scrollLeft = 0;
            });
            // MANUALLY SCROLL LIST //
            var content_list = document.getElementById("content-container");
            on(content_list, touch.press, function (press_evt) {
                press_evt.preventDefault();
                var clientX = press_evt.clientX;
                var move_handle = on(content_list, touch.move, function (move_evt) {
                    // https://github.com/asvd/dragscroll/blob/master/dragscroll.js#L68
                    content_container.scrollLeft -= (-clientX + (clientX = move_evt.clientX));
                });
                on.once(content_list, touch.release, function (release_evt) {
                    release_evt.preventDefault();
                    move_handle.remove();
                });
                on.once(content_list, touch.cancel, function (cancel_evt) {
                    cancel_evt.preventDefault();
                    move_handle.remove();
                });
            });
        };
        /**
         * INITIALIZE GROUP CONTENT
         *
         * @param group_id
         */
        Main.prototype.initializeGroupContent = function (group_id) {
            return __awaiter(this, void 0, void 0, function () {
                var groupResponse, portal_group;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.base.portal.queryGroups({ query: "id:" + group_id })];
                        case 1:
                            groupResponse = _a.sent();
                            // DID WE FIND THE GROUP
                            if (groupResponse.results.length > 0) {
                                portal_group = groupResponse.results[0];
                                // INITIALIZE PANEL CONTENT AND GET FUNCTION TO DISPLAY ITEM DETAILS //
                                this.displayItemDetails = this.initializePanelContent(portal_group);
                                // SEARCH FOR GROUP ITEMS //
                                return [2 /*return*/, this.getGroupItems(portal_group, 1).then(function () {
                                        // CREATE LAYER ITEM LIST SCROLL //
                                        _this.initializeItemListScroll();
                                    })];
                            }
                            else {
                                // WE DIDN'T FIND THE GROUP, SO LET'S FORCE THE USER TO SIGN IN AND TRY AGAIN //
                                // TODO: DO WE STILL NEED THIS?
                                return [2 /*return*/, this.initializeUserSignIn(true).always(function () {
                                        return _this.initializeGroupContent(group_id);
                                    })];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
        * QUERY FOR LAYER ITEMS IN THE GROUP
        *  - ONLY ONE SEARCH SO MAXIMUM 100 ITEMS RETURNED
        *  - USES GROUP CONFIGURED SORT PARAMETERS
        *
        * @param portalGroup
        * @param start
        */
        Main.prototype.getGroupItems = function (portalGroup, start) {
            var _this = this;
            // SEARCH QUERY //
            // TODO: DO WE INCLUDE CURRENT CULTURE IN THE QUERY?
            var layer_search_query = '(type:Service AND typekeywords:(-"Tool" -"Geodata Service" -"Globe Service" -"Database" -"Workflow" -"Service Definition"))';
            // FIND LAYER ITEMS //
            return portalGroup.queryItems({
                start: start,
                num: 100,
                sortField: portalGroup.sortField || "title",
                sortOrder: portalGroup.sortOrder || "asc",
                query: layer_search_query
            }).then(function (queryResults) {
                // DISPLAY LAYER ITEMS //
                _this.displayLayerItems(queryResults.results);
                // TODO: GET MORE RESULTS?
                return queryResults;
            });
        };
        /**
         * CREATE A SCROLLABLE LIST OF LAYER ITEMS NODES //
         *
         * @param layer_items
         */
        Main.prototype.displayLayerItems = function (layer_items) {
            var _this = this;
            // CREATE LAYER ITEM NODES //
            layer_items.forEach(function (layer_item) {
                // LAYER ITEM NODE //
                var item_node = domConstruct.create("li", {
                    className: "content-item",
                }, "content-container");
                // THUMBNAIL NODE //
                domConstruct.create("img", {
                    className: "content-item-img",
                    src: layer_item.thumbnailUrl,
                    alt: layer_item.title
                }, item_node);
                // ACTION NODE //
                var action_node = domConstruct.create("span", {
                    className: "item-actions text-center text-white",
                }, item_node);
                // ADD BUTTON //
                var add_btn = domConstruct.create("button", {
                    className: "item-action esri-icon-down btn btn-small btn-transparent",
                    title: i18n.item.add_to_map.title,
                }, action_node);
                // ADD VISIBLE BUTTON //
                var add_visible_btn = domConstruct.create("button", {
                    className: "item-action esri-icon-visible btn btn-small btn-transparent",
                    title: i18n.item.add_to_map_only_visible.title
                }, action_node);
                // TITLE NODE //
                var item_title_node = domConstruct.create("button", {
                    className: "content-item-title btn btn-transparent avenir-demi font-size-0 esri-interactive icon-ui-description",
                    innerHTML: layer_item.title.trim()
                }, item_node);
                // DISPLAY ITEM DETAILS //
                item_title_node.addEventListener("click", function () {
                    _this.displayItemDetails(layer_item);
                });
                // ADD LAYER //
                add_btn.addEventListener("click", function () {
                    _this.addItemToMap(layer_item);
                    _this.displayItemDetails(layer_item);
                });
                // ADD LAYER VISIBLE //
                add_visible_btn.addEventListener("click", function () {
                    _this.setAllLayersVisibility(false);
                    _this.addItemToMap(layer_item);
                    _this.displayItemDetails(layer_item);
                });
            });
        };
        /**
        * SET PANEL CONTENT TO LAYER ITEM OR GROUP
        *
        * @param portal_group
        * @returns {function(*=)}
        */
        Main.prototype.initializePanelContent = function (portal_group) {
            var _this = this;
            // UPDATE THE PANEL CONTENT WITH INFORMATION ABOUT A LAYER ITEM OR THE CONFIGURED GROUP //
            var display_content = function (item_or_group) {
                if (item_or_group) {
                    // IS ITEM OR GROUP //
                    var type = (item_or_group.declaredClass === "esri.portal.PortalGroup") ? "group" : "item";
                    domClass.toggle("content-reset-node", "hide", (type === "group"));
                    // TITLE //
                    document.getElementById("content-title-label").innerHTML = item_or_group.title;
                    document.getElementById("content-title-label").title = item_or_group.snippet || "";
                    // DETAILS LINK //
                    var detailsLink = document.getElementById("content-details-link");
                    detailsLink.href = _this.base.portal.url + "/home/" + type + ".html?id=" + item_or_group.id;
                    // DESCRIPTION //
                    document.getElementById("content-description").innerHTML = item_or_group.description || ((type === "group") ? i18n.panel.missing_description_group : i18n.panel.missing_description_item);
                }
            };
            // RESET PANEL CONTENT //
            document.getElementById("content-reset-node").addEventListener("click", function () {
                display_content(portal_group);
            });
            // SET INITIAL PANEL CONTENT TO GROUP //
            display_content(portal_group);
            /**
             * SET PANEL CONTENT TO LAYER ITEM
             */
            return function (layer_item) {
                // IF NO ITEM IS PROVIDED THEN USE THE CONFIGURED GROUP //
                display_content(layer_item || portal_group);
            };
        };
        /**
        * ADD ITEM TO MAP
        *  - IF THE LAYER IS ALREADY IN THE MAP, JUST MAKE SURE IT'S VISIBLE
        *
        * @param map
        */
        Main.prototype._addItemToMap = function (map) {
            var _this = this;
            return function (item) {
                // IS LAYER ALREADY IN THE MAP //
                var item_layer = map.layers.find(function (layer) {
                    return (layer.portalItem.id === item.id);
                });
                if (item_layer) {
                    // IF ALREADY IN THE MAP, JUST MAKE IT VISIBLE //
                    item_layer.visible = true;
                }
                else {
                    // GET LAYER FROM ITEM //
                    _this.getItemLayer(item).then(function (itemLayer) {
                        item_layer = itemLayer;
                        // ADD LAYER TO MAP //
                        map.add(item_layer);
                        // ADD NOTIFICATION //
                        _this.addLayerNotification(item);
                        // RESET PANEL IF LAYER REMOVED //
                        _this.on("layer-removed", function (removed_layer) {
                            if (removed_layer.id === item_layer.id) {
                                _this.displayItemDetails();
                            }
                        });
                    }).otherwise(function (error) {
                        _this.addLayerNotification(item, error);
                    });
                }
            };
        };
        /**
         * MAKE SURE TO RETURN A LOADED PortalItem
         *
         * @param itemLike
         * @returns {Promise<PortalItem>}
         * @private
         */
        Main.prototype._getItem = function (itemLike) {
            if (itemLike.declaredClass === "esri.portal.PortalItem") {
                return itemLike.loaded ? promiseUtils.resolve(itemLike) : itemLike.load();
            }
            else {
                var item = new PortalItem({ id: itemLike.id });
                return item.load();
            }
        };
        /**
         * GET THE LAYER FROM THE PortalItem
         *  - APPLY OVERRIDES IF AVAILABLE
         *
         * @param itemLike
         * @returns {*}
         */
        Main.prototype.getItemLayer = function (itemLike) {
            // GET FULL ITEM //
            return this._getItem(itemLike).then(function (item) {
                // IS ITEM A LAYER //
                if (item.isLayer) {
                    // CREATE LAYER FROM ITEM //
                    return Layer.fromPortalItem({ portalItem: item }).then(function (layer) {
                        // LOAD LAYER //
                        return layer.load().then(function () {
                            // FETCH ITEM OVERRIDES //
                            return item.fetchData().then(function (item_data) {
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
                                                var mapImageLayer = layer;
                                                var visible_layers_1 = item_data.visibleLayers || [];
                                                mapImageLayer.allSublayers.forEach(function (sublayer) {
                                                    sublayer.visible = visible_layers_1.includes(sublayer.id);
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
                        }).otherwise(function () {
                            // LAYER WAS NOT LOADED //
                            return promiseUtils.reject(new Error(layer.loadError.toString()));
                        });
                    }).otherwise(function () {
                        // COULDN'T CREATE LAYER FROM ITEM //
                        return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.layer_no_create_template, item)));
                    });
                }
                else {
                    // ITEM IS NOT A LAYER //
                    return promiseUtils.reject(new Error(lang.replace(i18n.errors.layer.item_not_layer_template, item)));
                }
            });
        };
        /**
         * ADD A LAYER ITEM NOTIFICATION
         *
         * @param layer_item
         * @param error
         */
        Main.prototype.addLayerNotification = function (layer_item, error) {
            var notificationsNode = document.getElementById("notifications-node");
            var alertNode = domConstruct.create("div", {
                className: error ? CSS.NOTIFICATION_TYPE.ERROR : CSS.NOTIFICATION_TYPE.SUCCESS
            }, notificationsNode);
            var alertCloseNode = domConstruct.create("div", { className: "inline-block esri-interactive icon-ui-close margin-left-1 right" }, alertNode);
            on.once(alertCloseNode, "click", function () {
                domConstruct.destroy(alertNode);
            });
            domConstruct.create("div", { innerHTML: error ? error.message : lang.replace(i18n.notifications.layer_added_template, layer_item) }, alertNode);
            if (error != null) {
                var itemDetailsPageUrl = this.base.portal.url + "/home/item.html?id=" + layer_item.id;
                domConstruct.create("a", { innerHTML: i18n.notifications.view_details.innerHTML, target: "_blank", href: itemDetailsPageUrl }, alertNode);
            }
            else {
                setTimeout(function () {
                    domClass.toggle(alertNode, "animate-in-up animate-out-up");
                    setTimeout(function () {
                        domConstruct.destroy(alertNode);
                    }, 500);
                }, 2000);
            }
        };
        /**
         * OPEN THE MAP VIEWER USING THE CURRENT MAP SETTINGS AND LAYERS
         *  - https://doc.arcgis.com/en/arcgis-online/reference/use-url-parameters.htm
         *
         * @param map_infos
         */
        Main.prototype.initializeCreateOnlineMap = function (map_infos) {
            var _this = this;
            document.getElementById("create-map-btn").addEventListener("click", function () {
                // CURRENT VIEW //
                var inputElement = document.getElementById("display-type-input");
                var display_type = inputElement.checked ? "2d" : "3d";
                var view = map_infos.views.get(display_type);
                // MAP VIEWER URL //
                var map_viewer_url_parameters = "center=" + view.center.longitude + "," + view.center.latitude + "&level=" + Math.floor(view.zoom) + "&";
                // BASEMAP URL //
                if (map_infos.map.basemap.baseLayers.length > 0) {
                    // ASSUMES THERE'S ONLY ONE //
                    map_viewer_url_parameters += "basemapUrl=" + map_infos.map.basemap.baseLayers.getItemAt(0).url + "&";
                }
                // REFERENCE URL //
                if (map_infos.map.basemap.referenceLayers.length > 0) {
                    // ASSUMES THERE'S ONLY ONE //
                    map_viewer_url_parameters += "basemapReferenceUrl=" + map_infos.map.basemap.referenceLayers.getItemAt(0).url + "&";
                }
                // LAYERS //
                var layer_ids = map_infos.map.layers.map(function (layer) {
                    return layer.portalItem.id;
                });
                map_viewer_url_parameters += "layers=" + layer_ids.join(",");
                // MAP VIEWER URL //
                var map_viewer_url = _this.base.portal.url + "/home/webmap/viewer.html";
                // OPEN MAP VIEWER //
                window.open(map_viewer_url + "?" + map_viewer_url_parameters);
            });
        };
        return Main;
    }((Evented)));
    return Main;
});
//# sourceMappingURL=Main.js.map