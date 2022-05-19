import { jstsToGeoJson } from "./GeoJsonFunctions.mjs"
import getMergeableFeatures, { handleIntersections, mergeFeatures } from "./JSTSFunctions.mjs"
import { addIntersectionNodes } from "./JSTSFunctions.mjs"
import { geoJsonFeatureCollection2JstsGeometries, jstsGeometries2GeoJsonFeatureCollection, jstsGeometry2GeoJsonFeature } from "../translation/translators.mjs"
import { geoJsonFeatureCollection2olFeatures, geoJsonFeature2JstsGeometry} from "../translation/translators.mjs"
import { getJstsGeometryCoordinates } from "../translation/getter.mjs"
import { coordinatesAreEquivalent } from "./HelperFunctions.mjs"
import Area from "jsts/org/locationtech/jts/algorithm/Area.js"

//takes geoJsonFeatureCollection as input and removes areas from the last drawn polygon where it overlaps with other polygons.
export const fixOverlaps = (features, modifiedFeatures=1) => {
    console.log(features)
    let areaOverCircLimit = 10
    let jstsCollection = geoJsonFeatureCollection2JstsGeometries(features)
    console.log("se till att jsts konvertering behåller multipolygon")
    console.log(jstsCollection)
    let preTrimmedNewPolygon = jstsCollection[jstsCollection.length - 1]
    let trimmed = handleIntersections(jstsCollection[jstsCollection.length - 1], jstsCollection.slice(0, jstsCollection.length - 1))
    let cleanedJstsCollection = []

    //add intersection nodes to old polygons
    jstsCollection.slice(0, jstsCollection.length - 1).forEach(function f(geom){
        let diff = (addIntersectionNodes(geom, [preTrimmedNewPolygon]))
        //removes too small polygons
        if(diff.getArea()/diff.getLength() > areaOverCircLimit){
            cleanedJstsCollection.push(diff)
        }
    })

    console.log("se till att cleanedjstscollection nedan har multipolygoner:")
    console.log(cleanedJstsCollection)

    //if the polygon has holes, remove holes that are too small
    if (trimmed._holes) {
        if (trimmed._holes.length > 0) {  
            for (let i = 0; i < trimmed._holes.length; i++) {
                let hole = trimmed._holes[i]

                //console.log("HOLE HERE, size is: ", Area.ofRing(hole._points._coordinates))
                if(Area.ofRing(hole._points._coordinates)/hole.getLength() < areaOverCircLimit) {
                    //console.log("HOLE REMOVED")
                    trimmed.holes.splice(i, 1)
                }
            }
        }
    }

    //If geometries exist then trimmed is a multipolygon and we want to push each polygon individually to cleanedJstsCollection.
    //TODO: do we want to change this behaviour to create a multipolygon instead of splitting into different polygons
    //TODO: change comments here if this behaviour has been changed.
    
    if (trimmed._geometries) {
        console.log("this is a multipolygon! we love multipolygons, so we add it.")
        cleanedJstsCollection.push(trimmed)
       /*  trimmed._geometries.forEach(function multiPolygonToPolygons(geom){
            if(geom.getArea()/geom.getLength() > areaOverCircLimit){
                cleanedJstsCollection.push(geom)
            }
        })  */
    }

    //if the polygon has an area (meaning its NOT entirely encapsulated by another polygon), add it.
    else if(trimmed._shell._points._coordinates.length > 0) { 
        if(trimmed.getArea()/trimmed.getLength() > areaOverCircLimit){
            cleanedJstsCollection.push(trimmed)
        }
    }
   
    console.log("se till att cleanedjstscollection nedan har multipolygoner:")
    console.log(cleanedJstsCollection)  
    console.log(jstsGeometries2GeoJsonFeatureCollection(cleanedJstsCollection))

    return jstsGeometries2GeoJsonFeatureCollection(cleanedJstsCollection)
}


//Takes geojsonFeatures and a featureCollection and returns geojson geometry
export const handleMerge = (firstInputPolygon, secondInputPolygon, featureCollection) => {
    
    console.log("HANDLEMERGE CALLED")

    //convert to jsts geometries
   
    let firstPolygon = geoJsonFeature2JstsGeometry(firstInputPolygon)
    let secondPolygon = geoJsonFeature2JstsGeometry(secondInputPolygon)

    let mergables = getMergeableFeatures(firstPolygon, featureCollection)
    let status = -1
    
    //console.log(mergables)

//TODO: if sats för multipolygoner eller något

 

    console.log(firstPolygon)
    console.log(secondPolygon)
    //if secondPolygon is a multipolygon
/*     if (secondPolygon._geometries || firstPolygon._geometries) {
        status = jstsGeometry2GeoJsonFeature(mergeFeatures(firstPolygon, secondPolygon))
    }

    else {
        mergables.forEach(function compare(mergablePolygon){
            if(coordinatesAreEquivalent(getJstsGeometryCoordinates(secondPolygon), getJstsGeometryCoordinates(mergablePolygon))){
                try {
                    console.log("THESE ARE MERGEABLE")
                    status = jstsGeometry2GeoJsonFeature(mergeFeatures(firstPolygon, secondPolygon))
                } catch (error) {
                    console.log("merge error on typeconversion") 
                }
            }
        })
    } */
    status = jstsGeometry2GeoJsonFeature(mergeFeatures(firstPolygon, secondPolygon))
    return status
}