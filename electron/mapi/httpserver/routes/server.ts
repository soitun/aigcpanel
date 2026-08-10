import { Router } from "express";
import type { Request, Response } from "express";
import { StorageMain } from "../../storage/main";
import { Events } from "../../event/main";
import { Log } from "../../log/main";
import { sendJson, asyncHandler } from "../utils";
import path from "node:path";
import fs from "node:fs";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Read config.json from a local model directory and build a server record,
 * mirroring the LOCAL_DIR import flow used by ServerAddDialog.vue.
 */
const buildRecordFromDir = async (localPath: string): Promise<any> => {
    const configPath = path.join(localPath, "config.json");
    let content = "";
    try {
        content = await fs.promises.readFile(configPath, "utf-8");
    } catch (e) {
        throw new Error(`cannot read config.json: ${e}`);
    }
    let json: any;
    try {
        json = JSON.parse(content);
    } catch (e) {
        throw new Error(`invalid config.json: ${e}`);
    }
    if (!json.name || !json.version) {
        throw new Error("config.json missing name/version");
    }
    return {
        key: `${json.name}|${json.version}`,
        name: json.name,
        title: json.title || json.name,
        version: json.version,
        type: "localDir",
        autoStart: json.entry === "__EasyServer__",
        functions: json.functions || [],
        localPath,
        settings: json.settings || [],
        setting: json.setting || {},
        config: json,
    };
};

// ── POST /api/server/install ─────────────────────────────────────────────
// Install (upsert) a model server from a local directory.
// Body: { path: "/abs/path/to/model-dir" }  (must contain config.json)
router.post(
    "/install",
    asyncHandler(async (req: Request, res: Response) => {
        const { path: localPath } = req.body || {};
        if (!localPath || typeof localPath !== "string") {
            sendJson(res, 400, { code: -1, msg: "Missing path" });
            return;
        }
        let record: any;
        try {
            record = await buildRecordFromDir(localPath);
        } catch (e) {
            sendJson(res, 400, { code: -1, msg: String(e) });
            return;
        }
        const storageData = (await StorageMain.read("server", null)) || {};
        const records = Array.isArray(storageData.records)
            ? storageData.records
            : [];
        const index = records.findIndex(
            (r: any) => r.name === record.name && r.version === record.version,
        );
        if (index >= 0) {
            records[index] = record;
        } else {
            records.push(record);
        }
        await StorageMain.set("server", "records", records);
        Log.info("httpserver.serverInstall", {
            name: record.name,
            version: record.version,
            localPath,
        });
        Events.callPage("main", "httpserver:serverReload", {}).catch((err) => {
            Log.error("httpserver.serverInstall.reload.error", err);
        });
        sendJson(res, 200, { code: 0, data: record });
    }),
);

// ── POST /api/server/remove ──────────────────────────────────────────────
// Remove an installed server record.
// Body: { name, version }
router.post(
    "/remove",
    asyncHandler(async (req: Request, res: Response) => {
        const { name, version } = req.body || {};
        if (!name || !version) {
            sendJson(res, 400, { code: -1, msg: "Missing name or version" });
            return;
        }
        const storageData = (await StorageMain.read("server", null)) || {};
        const records = Array.isArray(storageData.records)
            ? storageData.records
            : [];
        const next = records.filter(
            (r: any) => !(r.name === name && r.version === version),
        );
        await StorageMain.set("server", "records", next);
        Events.callPage("main", "httpserver:serverReload", {}).catch((err) => {
            Log.error("httpserver.serverRemove.reload.error", err);
        });
        sendJson(res, 200, {
            code: 0,
            data: { removed: records.length - next.length },
        });
    }),
);

export default router;
