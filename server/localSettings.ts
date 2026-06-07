import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar o diretório raiz do projeto para o arquivo de dados
const STORAGE_FILE = path.resolve(__dirname, '../../data_settings.json');

export interface InstanceSettings {
    tokens: string;
    rotationMinutes: number;
    delaySeconds: number;
    mainMessage: string;
    category: string;
}

export async function saveSettings(botName: string, settings: InstanceSettings) {
    let allSettings: Record<string, InstanceSettings> = {};
    if (fs.existsSync(STORAGE_FILE)) {
        try {
            allSettings = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
        } catch (e) {
            console.error("Error reading storage file:", e);
        }
    }
    allSettings[botName] = settings;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(allSettings, null, 2));
}

export async function getSettings(botName: string): Promise<InstanceSettings | null> {
    if (!fs.existsSync(STORAGE_FILE)) return null;
    try {
        const allSettings = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
        return allSettings[botName] || null;
    } catch (e) {
        console.error("Error reading storage file:", e);
        return null;
    }
}
