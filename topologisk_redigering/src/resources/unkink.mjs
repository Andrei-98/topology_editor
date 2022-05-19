import simplepolygon from 'simplepolygon';
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import OL3Parser from "jsts/org/locationtech/jts/io/OL3Parser.js";
import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js'
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp.js'
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp.js"
import { Point, LineString, LinearRing, Polygon, MultiLineString, MultiPolygon } from 'ol/geom.js'
import MultiPoint from 'ol/geom/MultiPoint.js';
import { geoJsonFeature2JstsGeometry, geoJsonFeature2geoJsonFeatureCollection } from '../translation/translators.mjs';
import { fixCoordinateRotation } from './HelperFunctions.mjs';

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


export const olToJsts = (poly) => {
    return parser.read(poly.getGeometry())
}


export const isValid = (geoJsonFeature) => {
    let jstsLastDrawnPoly
    try {
        jstsLastDrawnPoly = geoJsonFeature2JstsGeometry(geoJsonFeature)
        return IsValidOp.isValid(jstsLastDrawnPoly);
    } catch (error) {
        console.log("isvalid error")
        console.log("if illegalArgumentException cause is from mergepolygon")
        console.log(error)
    }
    return false
}

/*
 * return true if @lastDrawnPoly intersects any of the polys in @allPolys
 * @lastDrawnPoly = openlayers feature
 * @allPolys = openlayer features
 */
function calculateIntersection(lastDrawnPoly, allPolys) {
    let jstsLastDrawnPoly = olToJsts(lastDrawnPoly)
    // shrink polygon by tiny amount otherwise it will count as intersect
    // if two polygons share a point on a border
    let bufferParameters = new BufferParameters();
    jstsLastDrawnPoly = BufferOp.bufferOp(jstsLastDrawnPoly, -.000001, bufferParameters);

    // iterate thought all the polygons and check if they intersect with lastDrawnPoly
    const result = allPolys.filter(function (poly) {
        const curPolygon = olToJsts(poly)
        const intersection = OverlayOp.intersection(curPolygon, jstsLastDrawnPoly);
        return intersection.isEmpty() === false;
    });

    return result.length > 0
}

export const unkink = (polygon) => {
    //dont unkink multipoly?
    if (polygon.geometry.type !== "MultiPolygon")
    {        
        let unkinkedPolygons = simplepolygon(polygon)
        unkinkedPolygons.features.forEach(polygon => {
            polygon = fixCoordinateRotation(polygon)
        })
        return unkinkedPolygons
    }
    else {
        //TODO: support for unkink on multipolygons would perhaps start here...
        return geoJsonFeature2geoJsonFeatureCollection(polygon)
    }
}