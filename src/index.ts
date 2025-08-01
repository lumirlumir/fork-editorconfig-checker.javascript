#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

import { COMBINED_PATH, VERSION } from "./constants"
import { downloadBinary, findRelease } from "./release"

async function main() {
  if (!(await isReady())) {
    try {
      const [name, assetId, assetFiletype] = await findRelease(VERSION)
      console.info(`Downloading ${name}`)
      await downloadBinary(assetId, assetFiletype)
    } catch (e) {
      console.error(`Failed to download binary:\n${e}`)
      await fs.rm(COMBINED_PATH, { recursive: true })
      process.exit(1)
    }
  }
  await execute()
}

main().catch(console.error)

async function execute() {
  const [name] = await fs.readdir(path.join(COMBINED_PATH, "bin"))
  const program = path.join(COMBINED_PATH, "bin", name)
  await fs.chmod(program, 0o755)
  const { status } = spawnSync(program, process.argv.slice(2), {
    stdio: "inherit",
    env: process.env,
  })
  process.exit(status ?? 0)
}

async function isReady() {
  try {
    await fs.stat(COMBINED_PATH)
    return true
  } catch {
    await fs.mkdir(COMBINED_PATH, { recursive: true })
    return false
  }
}
