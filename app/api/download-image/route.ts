import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")
  const filename = searchParams.get("filename")

  if (!imageUrl) {
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
  }

  try {
    console.log("[v0] Downloading image from:", imageUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageDownloader/1.0)",
        Accept: "image/*",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    console.log("[v0] Image downloaded successfully, size:", imageBuffer.byteLength)

    // Return the image with proper headers for download
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename || "image.jpg"}"`,
        "Content-Length": imageBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading image:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Download timeout - image took too long to fetch" }, { status: 408 })
    }

    return NextResponse.json(
      {
        error: "Failed to download image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
