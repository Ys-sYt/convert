// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

//import tj from '@mapbox/togeojson';
import { DOMParser } from 'xmldom';

//import toGeoJSON from '@mapbox/togeojson';
//import fs from 'fs';

//import { kml } from "@tmcw/togeojson";
import { gpx } from "@tmcw/togeojson";

//import length from '@turf/length';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
//import  buffer  from '@turf/buffer';

const mapimgCoord = [
    [139.8276436, 36.7659966],
    [139.8499857, 36.7683691],
    [139.8520458, 36.7557454],
    [139.82969458, 36.75335628],  
]

const bearing = -7;

const map = new maplibregl.Map({
    container: 'map', // div要素のid
    zoom: 14,
    center: [139.8381, 36.7607],
    //minZoom: 5, // 最小ズーム
    maxZoom: 18, // 最大ズーム
    //maxBounds: [122, 20, 154, 50], // 表示可能な範囲
    bearing: bearing,
        style: {
        version: 8,
        sources: {
            // 背景地図ソース
            mierune_base: {
                type: 'raster',
                tiles: ['https://api.maptiler.com/maps/jp-mierune-gray/{z}/{x}/{y}.png?key=Oh6R8jzq3P80WGrClSBG'],
                tileSize: 512,
                attribution:
                    '<a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a> <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
            },
            hillshade:{
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png'],
                attribution:
                '<a href="https://maps.gsi.go.jp/development/ichiran.html#hillshademap" target="_blank">&copy; 国土地理院</a>'
            },
            mapimg: {
                type: 'image',
                url: './map.jpg',
                coordinates: mapimgCoord,
            } 
        },
        layers: [
            // 背景地図レイヤー
            {
                id: 'base',
                source: 'mierune_base',
                type: 'raster',
            },
            {
                'id': 'mapimg',
                'type': 'raster',
                'source': 'mapimg',
                'paint': {
                    'raster-opacity': 1,
                }
            },
            {
                id: 'hillshade',
                source: 'hillshade',
                type: 'raster',
                'paint': {
                    "raster-opacity": 0.2
                }
            },
        ],
    }
});

//chatGPT, 読み込みファイル削除関数
function removeExistingData(map) {
    // レイヤーIDとソースIDが分かっている場合
    const layerId = ['route', 'outline']; // 以前に追加したレイヤーのID
    const sourceId = ['gpx', 'outline']; // 以前に追加したソースのID

    // レイヤーの存在を確認して削除
    layerId.forEach(id => {
        if (map.getLayer(id)) {
            map.removeLayer(id);
        }
    });

    // ソースの存在を確認して削除
    sourceId.forEach(id => {
        if (map.getSource(id)) {
            map.removeSource(id);
        }
    });

    //生成したgeojsonも削除する。
    //delete geojson;

}


let geojson;
//let totalLength; 


// ファイルアップロードのためのinput要素のイベントリスナーを設定
// geojson生成
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;

            // 既存のデータを削除
            removeExistingData(map);
            
            //違うアプローチ
            //const geojson = (kml(new DOMParser().parseFromString(text)));
            geojson = (gpx(new DOMParser().parseFromString(text))); //featurecollectionとして読み込み
            //console.log(geojson);
            //featureにするためにフィルタリング
            geojson = geojson.features[0];
            //console.log(geojson);

            //↑ではだめで、lineストリングを各セクションでfeatureとして保存、そこに諸々の情報を書き込む必要あり。

            //座標のみ抽出
            const coordinates = geojson.geometry.coordinates;
            const timeList = geojson.properties.coordinateProperties.times;
            const heartRate = geojson.properties.coordinateProperties["ns3:TrackPointExtensions"];
            const timeDif = [];
            //console.log(heartRate);
            //console.log(coordinates);
            
            
            //ペース(min/km)の配列を作成
            const pace = []; 

            for (let i = 0; i < coordinates.length - 1; i++) {
                const startPoint = point(coordinates[i]);
                const endPoint = point(coordinates[i+1]);

                const dis = distance(startPoint, endPoint, {units: 'kilometers'});

                const startTime = new Date(timeList[i]);
                const endTime = new Date(timeList[i+1]);
                const timedif = (endTime - startTime)/1000; //ミリ秒を秒に変換
                //console.log(timedif);
                const minPerKilo = (timedif / 60) / dis;

                timeDif.push(timedif);
                pace.push(minPerKilo);
            };

            //戦略：繰り返し
            //からのgeojson作り、そこにforループで追加していく
            //propertyには, pace, time, timedif, hartRateを追加。

            //カラのgeojson
            var newGeoJson = {
                "type": "FeatureCollection",
                "name": "route",
                "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
                "features": []
            };

            for (var i = 0; i < coordinates.length - 1; i++) {
                var segment = {
                    "type": "Feature",
                    "properties": {
                        "time": timeList[i],
                        "pace": pace[i], 
                        "hearRate": heartRate[i],
                        "timeDif": timeDif[i],          
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [coordinates[i], coordinates[i+1]]
                    }
                };
                newGeoJson.features.push(segment);
            };
            //console.log(newGeoJson);


            map.addSource('gpx', {
                type: 'geojson',
                data: newGeoJson
            });

            map.addSource('outline', {
                type: 'geojson',
                data: geojson
            });

            //test - outline
            map.addLayer({
                id: 'outline',
                type: 'line',
                source: 'outline',
                layout:{},
                paint: {
                    'line-width': 1,
                    'line-color': 'black',
                    'line-opacity':0.6,
                    'line-gap-width': 5
                }
            })
            
            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'gpx',
                layout: {
                    'line-join': 'round',
                },
                paint: {
                    'line-width': 5,
                    'line-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'pace'],
                        //0, '#d7191c',
                        3, 'rgb(0, 128, 0)',
                        10, 'rgb(255, 255, 0)',
                        15, 'rgb(255, 0, 0)',
                    ],
                    'line-opacity': 0.5,
                    //'line-gap-width': 5
                },
                'layout': {
                    'line-cap': 'butt', // featureの寄せ集めなので、これが接続部。buttが一番違和感ない. round, squire
                    //'visibility': 'none',
                    'line-round-limit': 5,
                    'line-join': 'miter',

                },
            });

            //https://maplibre.org/maplibre-gl-js/docs/examples/zoomto-linestring/
            //ラインのboundsにズーム
            //buildしないとfitしない。
            //fitさせる必要も無いような気がしてきた。
/*             
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
                padding: 20
            });
 */
            //console.log(bounds);
        };
        reader.readAsText(file);

        //document.getElementById("dis").textContent = dis;
        
    }


});

//スライドバーが動いたらその値にする。
const routeOpacity = document.getElementById('sliderLineOpacity');
routeOpacity.addEventListener('input', function(){
    let routeOpacityFloat = parseFloat(routeOpacity.value);
	//console.log(routeOpacity.value);
    map.setPaintProperty('route', 'line-opacity', routeOpacityFloat);
    map.setPaintProperty('outline', 'line-opacity', routeOpacityFloat);
});

const routewidth = document.getElementById('sliderLinewidth');
routewidth.addEventListener('input', function(){
    let routeWidthFloat = parseFloat(routewidth.value);
	//console.log(routewidth.value);
    map.setPaintProperty('route', 'line-width', routeWidthFloat);
    map.setPaintProperty('outline', 'line-gap-width', routeWidthFloat);
    //map.setPaintProperty('outline', 'line-opacity', routeOpacityFloat);
});
