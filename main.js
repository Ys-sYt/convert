// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

//import tj from '@mapbox/togeojson';
import { DOMParser } from 'xmldom';

import toGeoJSON from '@mapbox/togeojson';
import fs from 'fs';

//import { kml } from "@tmcw/togeojson";
import { gpx } from "@tmcw/togeojson";


const map = new maplibregl.Map({
    container: 'map', // div要素のid
    zoom: 5, // 初期表示のズーム
    center: [21.13, 55.70], // 初期表示の中心
    //minZoom: 5, // 最小ズーム
    maxZoom: 18, // 最大ズーム
    //maxBounds: [122, 20, 154, 50], // 表示可能な範囲
    style: {
        version: 8,
        sources: {
            // 背景地図ソース
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                maxzoom: 19,
                tileSize: 256,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
        },
        layers: [
            // 背景地図レイヤー
            {
                id: 'osm-layer',
                source: 'osm',
                type: 'raster',
            },
        ],
    }
});



// ファイルアップロードのためのinput要素のイベントリスナーを設定
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;

            //違うアプローチ
            //const geojson = (kml(new DOMParser().parseFromString(text)));
            const geojson = (gpx(new DOMParser().parseFromString(text)));
            console.log(geojson);

            //ここでソースに追加, マルチポイントとして描画されている。
            map.addSource('kml', {
                type: 'geojson',
                data: geojson
            });
            map.addLayer({
                id: 'kml-layer',
                type: 'line',
                source: 'kml',
                layout: {},
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2
                },
            });

            const coordinates = geojson.features[0].geometry.coordinates;
            console.log(coordinates);

            //では、点データとして読み込むのではなくラインデータとして読み込みたい。      


        };
        reader.readAsText(file);
        
    }


});
