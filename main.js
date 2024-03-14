// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

//import tj from '@mapbox/togeojson';
import { DOMParser } from 'xmldom';

//import toGeoJSON from '@mapbox/togeojson';
//import fs from 'fs';

//import { kml } from "@tmcw/togeojson";
import { gpx } from "@tmcw/togeojson";

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
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                maxzoom: 19,
                tileSize: 256,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
                id: 'osm-layer',
                source: 'osm',
                type: 'raster',
            },
            {
                'id': 'mapimg',
                'type': 'raster',
                'source': 'mapimg',
                'paint': {
                    'raster-opacity': 0.7,
                }
            },
        ],
    }
});

//chatGPT, 読み込みファイル削除関数
function removeExistingData(map) {
    // レイヤーIDとソースIDが分かっている場合
    const layerId = "gpx-layer"; // 以前に追加したレイヤーのID
    const sourceId = "gpx"; // 以前に追加したソースのID（レイヤーと同じIDを使っている場合）

    // レイヤーの存在を確認して削除
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }

    // ソースの存在を確認して削除
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
}


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
            const geojson = (gpx(new DOMParser().parseFromString(text)));
            console.log(geojson);

            //ここでソースに追加, マルチポイントとして描画されている。
            map.addSource('gpx', {
                type: 'geojson',
                data: geojson
            });
            map.addLayer({
                id: 'gpx-layer',
                type: 'line',
                source: 'gpx',
                layout: {},
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2
                },
            });

            const coordinates = geojson.features[0].geometry.coordinates;
            //console.log(coordinates);


            //KMLでは点データとして読み込み。ラインとして描画可能。 
            //geojsonではラインデータとして読み込み。
            //時間データも含まれている。座標を取得し、時間の差と合わせて移動距離を計算？
            
            //https://maplibre.org/maplibre-gl-js/docs/examples/zoomto-linestring/
            //ラインのboundsにズーム
            //buildしないと無理？
            
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
                padding: 20
            });

            console.log(bounds);
            map.setBearing(bearing);

        };
        reader.readAsText(file);


        
    }


});



//メモ・将来やること
//garminの心拍数とか読み取り？
//地図読み込んで

