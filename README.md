# ribbon-gallery (Layer Showcase)

A configurable application that displays a collection of layers from a group to support exploration of geographic content in both 2D and 3D views.

The Layer Showcase allows you to display a gallery of layers within a group. This app is handy for allowing users to explore layer-based content, viewing it on a map or globe, and optionally creating a new map based on the layers that have been added to the view. The vast majority of your work should go into styling and documenting the layer items, you can then share the layers with a group to deliver content via the Layer Showcase. This is a simple and interactive way to allow users to browse a group of content and then transition from layers to maps.

The side panel of the Layer Showcase opens with group description, including graphics, text, and links. When you click a layer info button, or add a layer, the side panel populates with the description from the layer item. The Layer Showcase includes a Table of Contents, visible minimized in the right corner of the map, which can be used to view the layer legend, change layer order, or remove all or selected layers. The side panel and the ribbon are retractable using the panel handles.


[View it live](http://www.arcgis.com/apps/LayerShowcase/index.html)

![App](http://www.arcgis.com/sharing/rest/content/items/42f6d0085ca34e67bb2ef0dae3e0f8f1/info/thumbnail/thumbnail1534955443981.png)

## Configurable Options 
* Provide a title and description for the application. If the group used in the app has a description, this will be used by default. 
* Set a default basemap and choose if you will include a basemap gallery to let users of the app explore different options.
* Choose a color theme or leverage the Shared Theme settings defined by your organization.
* Hide the side panel and/or the layer carousel when the app is opened. 
* Choose whether to include or hide the 2D/3D toggle button and the Create Map button.

## Use Cases
* Simple Kiosk application to allow users to explore geographic together or individually
* Provide basic self-service mapping capabilities to your audience by making it very easy to discover and add high quality layers to a map
* Show off your work to the public and let them access your most relavent layers in the context of a simple viewer

## Instructions

1. Fork and then clone the repo. 
2. Install dependencies with npm install.
3. Update config/application.json with your preferences

## Requirements

* Notepad or your favorite HTML editor
* Web browser with access to the Internet
* NPM 

## Resources

* [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/)
* [Create ArcGIS Online Configurable Apps](http://doc.arcgis.com/en/arcgis-online/create-maps/create-app-templates.htm)


## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

## Licensing
Copyright 2018 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt]( https://raw.github.com/Esri/ribbon-gallery/master/license.txt) file.

[](Esri Tags: ArcGIS Online)
[](Esri Language: JavaScript)​