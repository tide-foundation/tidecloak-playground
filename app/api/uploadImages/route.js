// app/api/upload/route.js
import fs from 'fs/promises'
import { NextResponse } from 'next/server'
import apiService from '../apiService'
import configs from '../apiConfigs'

export const runtime = 'nodejs'

export async function POST() {
  const { realm, baseURL } = configs

  // filenames & paths
  const logoName = 'playground-logo.png'
  const bgName   = 'playground-bg.jpg'
  const logoPath = `public/${logoName}`
  const bgPath   = `public/${bgName}`

  try {
    // read files
    const [logoBuffer, bgBuffer] = await Promise.all([
      fs.readFile(logoPath),
      fs.readFile(bgPath),
    ])

    const makeFd = (buffer, filename, type) => {
      const fd = new FormData()
      fd.append('fileData', new Blob([buffer]), filename)
      fd.append('fileName', filename)
      fd.append('fileType', type)
      return fd
    }

    const logoData = makeFd(logoBuffer, logoName, 'LOGO')
    const bgData   = makeFd(bgBuffer,   bgName,   'BACKGROUND_IMAGE')

    const masterToken = await apiService.getMasterToken(baseURL)

    // Upload logo
    const logoRes = await apiService.uploadImage(baseURL, realm, masterToken, logoData)
    if (!logoRes.ok) {
      throw new Error(`Logo upload failed: ${logoRes.status} ${logoRes.statusText}`)
    }

    // Upload background
    let bgRes
    try {
      bgRes = await apiService.uploadImage(baseURL, realm, masterToken, bgData)
      if (!bgRes.ok) {
        throw new Error(`Background upload failed: ${bgRes.status} ${bgRes.statusText}`)
      }
    } catch (uploadErr) {
      // rollback logo if background upload failed
      await apiService.deleteImage(baseURL, realm, masterToken, 'LOGO')
      throw uploadErr
    }

    return NextResponse.json({
      success: true,
      logoUpload:       { status: logoRes.status },
      backgroundUpload: { status: bgRes.status },
    })
  } catch (err) {
    console.error('Upload sequence error:', err)
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
