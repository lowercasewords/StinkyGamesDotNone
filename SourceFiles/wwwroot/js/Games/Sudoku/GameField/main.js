﻿import { Grid } from '/js/Games/Sudoku/GameField/grid.js';
import { Tile } from '/js/Games/Sudoku/GameField/tile.js';
import { mapRenderer } from '/js/Games/Sudoku/GameField/mapRenderer.js';
// NOTE: Coordinates in upper-left corner are (0, 0)! The y-axis is flipped! 
// NOTE: Calls for starter gameInfo creation and rendering happens on the bottom

export const canvas = document.getElementById('sudoku-canvas-map');
export const ctx = canvas.getContext('2d');

// Percentile chance of a single tile to be filled with deafult value
let tileChance = 10;

let gridAmount = 3;
let tileAmount = 3;

/** Represents the single Sudoku Map! When game starts, gameInfo creates nXn 2d array of grids
 * and each one of them has nXn 2d array of tiles (n is a player specified size)
 * Each tile in the grids is filled with values to ensure a possible victory, some 
 * values are then deleted depending on the 'chance' variable
 */
export const gameInfo = new class {

    constructor() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.gridAmount = 3;
        this.tileAmount = 3;
        /** 2d array of gameInfo grids */
        this.grids = [];
        /** Physical size of the game gameInfo */
        this.size = canvas.width;
        /** Info about currently clicked tile */
        this.clkdTileInfo = {
            tile : null,
            gR : null,
            gC : null,
            tC : null,
            tR : null 
        }
    }
    

    startGame = (gridAmount = 3, tileAmount = 3) => {
        console.log('Game starts...');
        this.gridAmount = gridAmount;
        this.tileAmount = tileAmount;
        createBoard();
        mapRenderer.renderMap();
        console.log('...game started!');
        console.log(gameInfo);
    }
    endGame = () => {
        throw new Error('Nothing was implemented yet!');
    }
    /**
     * Initializes the grids and tiles of the gameInfo
     * @param {Number} gridAmount amount of grids
     * @param {Number} tileAmount amount of tiles 
     */
    createBoard() {
        // ctx.lineWidth = 3;
        updateSize();
        for (let row = 0; row < gameInfo.gridAmount; row++) {
            gameInfo.grids[row] = [];
            for (let col = 0; col < gameInfo.gridAmount; col++) {
                let grid = new Grid(row * gameInfo.gridSize, col * gameInfo.gridSize, row, col, 'null' , 'pink');
                gameInfo.grids[row][col] = grid;
                grid.createTiles();
            }
        }
    }
    
    /**
     * Rescales the size of the gameInfo an its components to fit the canvas
     */
    rescaleAsync() {
        updateSize();
        for (let gridRow = 0; gridRow < this.grids.length; gridRow++) {
            for (let gridCol = 0; gridCol < this.grids[gridRow].length; gridCol++) {
                let grid = this.grids[gridRow][gridCol];
                // new Promise((resolve, reject) => 
                grid.rescaleAsync(gridRow, gridCol)
                // );
            }
        }
    }
    // Update methods
    //------------------------------------------\\
    /** 
     * Updates grid size and ALL ITS COMPONENTS
     */
    updateSize() {
        gameInfo.size = canvas.width;
        gameInfo.gridSize = canvas.width / gameInfo.gridAmount - 1;
        gameInfo.tileSize = gameInfo.gridSize / gameInfo.tileAmount - 1;
        
    }
    /**
     * Updates the clicked tile object 
     * @param {Number} x-coordinate of the click
     * @param {Number} y-coodrinate of the click
     */
    updateClickedTile = (clickX, clickY) => {
        for (let gR = 0; gR < gameInfo.grids.length; gR++) {
            for (let gC = 0; gC < gameInfo.grids[gR].length; gC++) {
                let tiles = gameInfo.grids[gR][gC].tiles;
                for (let tR = 0; tR < tiles.length; tR++) {
                    for (let tC = 0; tC < tiles[tR].length; tC++) 
                    {
                        if (tiles[tR][tC].inShape(clickX, clickY)) 
                        {
                            this.clkdTileInfo.tile = tiles[tR][tC];
                            this.clkdTileInfo.gR = gR;
                            this.clkdTileInfo.gC = gC;
                            this.clkdTileInfo.tC = tC;
                            this.clkdTileInfo.tR = tR;
                            return;
                        }
                    }
                }
            }
        }
        this.clkdTileInfo.tile = null;
        this.clkdTileInfo.gR = null;
        this.clkdTileInfo.tC = null;
        this.clkdTileInfo.gC = null;
        this.clkdTileInfo.tR = null;
    }
    //------------------------------------------//


    // Value check methods
    //------------------------------------------------------------------------\\
    /** 
     * Checks whether or not the value is not repeating accross the gameInfo or inside of its grid
     * @param {Number} baseGR The grid row of the tile
     * @param {Number} baseGC The grid column of the tile
     * @param {Number} baseGR The tile row of the tile
     * @param {Number} baseGC The tile column of the tile
     * @returns True if value is not repeating -> value was set to a tile, otherwise false
     */
    checkValue = async (baseGR, baseGC, baseTR, baseTC, value) => {
        let horizCheck = checkValuesHoriz(this.grids, baseGR, baseGC, baseTR, baseTC, value);
        let vertCheck = checkValuesVert(this.grids, baseGR, baseGC, baseTR, baseTC, value);
        
        let gridCheck = this.grids[baseGR][baseGC].checkGridValues(value);
        return (await Promise.all([horizCheck, vertCheck, gridCheck])).every(result => result == true);
    }
    /**
     * Checks if the specific value is unique horizontally across the grids in one tile lane
     * @param {Number} baseGR Grid row of the value
     * @param {Number} baseGC Grid column of the value 
     * @param {Number} baseTR Tile row of the value 
     * @param {Number} baseTC Tile column of the value 
     * @param {Number} value The value to be checked
     * @returns Whether or not the value is unique horizontally
     */
    checkValuesHoriz(grids, baseGR, baseGC, baseTR, baseTC, value) {
        return new Promise((resolve, rejected) => {
            // Horizontal Check
            for (let checkGR = 0; checkGR < grids.length; checkGR++) {
                let tiles = grids[checkGR][baseGC].tiles;
                for(let checkTR = 0; checkTR < grids[checkGR][baseGC].tiles.length; checkTR++) {
                    // skips non-existing grids
                    if(grids[checkGR][baseGC] == undefined && baseGR != checkGR) {
                        resolve(true);
                        return;
                    }
                    // skips base tile & tiles with no value
                    if(checkGR == baseGR && checkTR == baseTR 
                        || tiles[checkTR][baseTC]?.value == undefined) {
                        continue;
                    }
                    // if a repeating one
                    if(tiles[checkTR][baseTC].value == value) {
                        resolve(true);
                        return;
                    }
                }
            }
            resolve(true); 
        });
    }
    /**
     * Checks if the specific value is unique vertically across the grids in one tile lane
     * @param {Number} baseGR Grid row of the value
     * @param {Number} baseGC Grid column of the value 
     * @param {Number} baseTR Tile row of the value 
     * @param {Number} baseTC Tile column of the value 
     * @param {Number} value The value to be checked
     * @returns Whether or not the value is unique vertically
     */
    checkValuesVert(grids, baseGR, baseGC, baseTR, baseTC, value) {
        // Vertical Check
        return new Promise((resolve, reject) => {
            for (let checkGC = 0; checkGC < grids[baseGR].length; checkGC++) {
                let tiles = grids[baseGR][checkGC].tiles;
                console.log(tiles);
                for(let checkTC = 0; checkTC < grids[baseGR][checkGC].tiles[baseTR].length; checkTC++) {
                    // skips non-existing grids
                    if(grids[baseGR][checkGC] == undefined && baseGC != checkGC) {
                        resolve(true);
                        return;
                    }
                    // skips base tile & tiles with no value
                    if(checkGC == baseGC && checkTC == baseTC 
                        || tiles[baseTR][checkTC]?.value == undefined) {
                            continue;
                    }
                    // if a repeating one
                    if(tiles[baseTR][checkTC].value == value) {
                        resolve(false);
                        return;
                    }
                }
            }
            resolve(true);
        });
    }
    //------------------------------------------------------------------------//
}


/**
 *  @param {any} n Max number for the range (excluded)
 *  @return {Number} Returns random integer from 0 to n (excluded)
 */
function randInt(n) {
    return Math.floor(Math.random() * n)
};