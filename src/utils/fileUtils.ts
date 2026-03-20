import type Game from "../db/game";
import type { GameState } from "../db/gameState";
import sanitize from 'sanitize-filename'

export async function saveTextFile(data: string, filename: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    element.click();
};

export async function openTextFile(accept: string): Promise<string> {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file')
    fileInput.setAttribute('accept', accept)
    return new Promise<string>((resolve, reject) => {
        fileInput.onchange = (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0 && files[0]) {
                const file = files[0]
                const reader = new FileReader()

                reader.onload = (e) => {
                    const contents = e.target?.result as string;
                    console.log("File contents:", contents)
                    resolve(contents)
                };


                reader.onerror = (e) => {
                    console.error("Error reading file: ", e.target?.error)
                    reject()
                };

                reader.readAsText(file);
                return
            }
            reject()
        }
        fileInput.click()
    })
}

export interface GameFile {
    game: Game
    gameState: GameState
}

export async function saveGame(gameFile: GameFile) {
    const json = JSON.stringify(gameFile, null, 2)
    saveTextFile(json, sanitize(gameFile.game.name) + '.json')
}

export async function loadGame() {
    const stringData = await openTextFile('.json')
    const gameFile = JSON.parse(stringData) as GameFile
    if (!gameFile.game || !gameFile.gameState) {
        throw Error('Invalid file format')
    }
    return gameFile
}