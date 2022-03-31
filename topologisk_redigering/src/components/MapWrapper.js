import React, { useState, useEffect, useRef } from 'react';
import { Feature, Map, MapEvent, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import WMTS from 'ol/source/WMTS';
import { get as getProjection } from 'ol/proj';
import { getWidth } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import MultiPoint from 'ol/geom/MultiPoint';
import OL3Parser from "jsts/org/locationtech/jts/io/OL3Parser";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp";
import { Point, LineString, LinearRing, Polygon, MultiLineString, MultiPolygon } from 'ol/geom'
import { drawPolygon, highlightPolygon } from '../res/UIFunctions.mjs';
import { featuresToGeoJson } from '../res/GeoJsonFunctions'
import { saveToDatabase, GeoJsonObjToFeatureList, loadPolyFromDB } from '../res/DatabaseFunctions.mjs';
import { zoomToLastPolygon } from './ZoomToPolygon'
import { getRenderPixel } from 'ol/render';
import { createStringXY } from 'ol/coordinate';
import MousePosition from 'ol/control/MousePosition'
import { defaults as defaultControls } from 'ol/control'
import Header from './Header'
<<<<<<< HEAD
import { stopPropagation } from 'ol/events/Event';
import { handleIntersections } from '../res/jsts.mjs';
import { fixOverlaps } from '../res/PolygonHandler.mjs';

=======
import { Select } from 'ol/interaction';
import {click} from 'ol/events/condition' 
import {deletePolygon} from '../res/HelperFunctions.mjs'
import {defaultStyle, selectedStyle} from '../res/Styles.mjs'
>>>>>>> refs/remotes/origin/main



function MapWrapper({geoJsonData}) {
    const [map, setMap] = useState();
    const [currentTool, setCurrentTool] = useState('NONE')
    //const [selectedPolygon, setSelectedPolygon] = useState()
    let clickHandlerState = 'NONE';
    const mapElement = useRef();
    const mapRef = useRef();
    mapRef.current = map;

    const projection = getProjection('EPSG:3857');
    const projectionExtent = projection.getExtent();
    const size = getWidth(projectionExtent) / 256;
    const resolutions = new Array(19);
    const matrixIds = new Array(19);
    for (let z = 0; z < 19; ++z) {
        //generate resolutions and matrixIds arrays for this WMTS
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
    }
    

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const parser = new OL3Parser();
    parser.inject(
        Point,
        LineString,
        LinearRing,
        Polygon,
        MultiPoint,
        MultiLineString,
        MultiPolygon
    );
    
    const OUTER_SWEDEN_EXTENT = [-1200000, 4700000, 2600000, 8500000];
    const wmts_3006_resolutions = [4096.0, 2048.0, 1024.0, 512.0, 256.0, 128.0, 64.0, 32.0, 16.0, 8.0];
    const wmts_3006_matrixIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];   

   

    const select = new Select({condition: click, style:selectedStyle})

    const tilegrid = new WMTSTileGrid({
        tileSize: 256,
        extent: OUTER_SWEDEN_EXTENT,
        resolutions: wmts_3006_resolutions,
        matrixIds: wmts_3006_matrixIds
    });

    const swedenMapLayer = new TileLayer({
        source: new WMTS({
            url: "https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/5401f50c-568c-3459-a49f-69426e4ed1c6/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=topowebb&STYLE=default&FORMAT=image/png",
            layer: "swedenMapLayer",
            format: 'image/png',
            matrixSet: '3006',
            tileGrid: tilegrid,
            version: '1.0.0',
            style: 'default',
            crossOrigin: 'anonymous',
            projection: "EPSG:3006",
            useSpatialIndex: 'false',
        }),
        style: 'default',
        wrapX: true,
    })

    const source = new VectorSource({
        wrapX: false,
        url: "http://localhost:4000/file1",
        format: new GeoJSON({ projection: "EPSG:3006" }),

    });

    const polygonLayer = new VectorLayer({
        source: source,
        style: defaultStyle
    });

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    //fixes overlaps for the latest polygon added to map
    const cleanUserInput = (map) => {
        let newPolygons = fixOverlaps(map)

            let featureList = (new GeoJSON()).readFeatures(newPolygons) //  GeoJSON.readFeatures(geoJsonData)

            const source = new VectorSource({
                wrapX: false,
                features: featureList
            });
            
            map.getLayers().getArray()[1].setSource(source)
    }

    const mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(2),
        projection: "EPSG:3006",
    })

    useEffect(() => {
       
        const initialMap = new Map({
            controls: defaultControls().extend([mousePositionControl]),
            target: mapElement.current,
            layers: [
                swedenMapLayer,
                polygonLayer
            ],
            view: new View({
                center: [609924.45, 6877630.37],
                zoom: 5.9,
                minZoom: 5.8,
                maxZoom: 17,

            }),
        });
        initialMap.on('click', onMapClickGetPixel)
        initialMap.addInteraction(select)
        setMap(initialMap)
    }, []);


    /* Contextual clickhandler, different actions depending on if you click on a polygon or somewhere on the map */
    const onMapClickGetPixel = (event) => {
<<<<<<< HEAD
        //console.log(clickHandlerState)
        //console.log(event.type)
        if (clickHandlerState === 'DRAWEND') {
            console.log("Running checks because polygon is finished drawing")
            
            //unkink the drawn polygon HERE
                
            cleanUserInput(event.map)

            clickHandlerState = 'NONE'
        }
        else if (clickHandlerState === 'NONE'){
            clickHandlerState = 'DRAW'
            //console.log(clickHandlerState)
            drawPolygon(event.map).addEventListener('drawend', () => {
                clickHandlerState = 'DRAWEND'
               // console.log("kartan har ", event.map.getLayers().getArray()[1].getSource().getFeatures(), " features")
                //console.log(clickHandlerState)
                //console.log(event.map.getInteractions().getArray().length)
                event.map.getInteractions().getArray().pop()
                event.map.getInteractions().getArray().pop()
                //console.log(event.map.getInteractions().getArray().length)
            })
        }
        else {}
=======


        /* Check if clicked on an existing polygon */
        if (isPolygon(event.map, event.pixel)){

            const clickedPolygon = getPolygon(event.map, event.pixel)
            const selectedPolygon = getSelectedPolygon()
            /* This done to make sure correct polygon is deleted. Otherwise the previous one is deleted because of delay. */
            if (clickedPolygon === selectedPolygon) {
                deletePolygon(event.map, select.getFeatures().getArray()[0])
            }
            

        } else {
            if (clickHandlerState === 'DRAWEND') {
                console.log("Running checks because polygon is finished drawing")
                
                //unkink the drawn polygon HERE
                    
                cleanUserInput(event.map)
    
                clickHandlerState = 'NONE'
            }
            else if (clickHandlerState === 'NONE'){
                clickHandlerState = 'DRAW'
                //console.log(clickHandlerState)
                drawPolygon(event.map).addEventListener('drawend', () => {
                    clickHandlerState = 'DRAWEND'
                   // console.log("kartan har ", event.map.getLayers().getArray()[1].getSource().getFeatures(), " features")
                    //console.log(clickHandlerState)
                    //console.log(event.map.getInteractions().getArray().length)
                    event.map.getInteractions().getArray().pop()
                    event.map.getInteractions().getArray().pop()
                    //console.log(event.map.getInteractions().getArray().length)
                })
            }
            else {}
    }
    }


    /* check if we are clicking on a polygon*/
    const isPolygon = (map, pixel) => {
        return map.getFeaturesAtPixel(pixel).length > 0 && map.getFeaturesAtPixel(pixel)[0].getGeometryName() === "Polygon"
>>>>>>> refs/remotes/origin/main
    }
   
    /* get the polygon we are clicking on */
    const getPolygon = (map, pixel) => {
        return map.getFeaturesAtPixel(pixel)[0]
    }

    /* get the polygon marked by select interaction */
    const getSelectedPolygon = () => {
        return select.getFeatures().getArray()[0]
    }

    return (
        <>
            <Header currentTool={currentTool} setCurrentTool={setCurrentTool}/>
            <div style={{ height: '100vh', width: '100%' }} 
            ref={mapElement} 
            className="map-container">                
            </div>
        </>
    );
}

export default MapWrapper;