import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customQuery = searchParams.get("query")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const perPage = Number.parseInt(searchParams.get("per_page") || "8")
    const source = searchParams.get("source") || "all" // Added source filter parameter

    if (!customQuery) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
    const pexelsKey = process.env.PEXELS_API_KEY

    const results = await Promise.allSettled([
      source === "all" || source === "unsplash" ? fetchUnsplash(customQuery, page, perPage, unsplashKey) : null,
      source === "all" || source === "pexels" ? fetchPexels(customQuery, page, perPage, pexelsKey) : null,
    ])

    let allImages: any[] = []
    let totalResults = 0
    let totalPages = 1

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        allImages = [...allImages, ...result.value.images]
        totalResults += result.value.total
        totalPages = Math.max(totalPages, result.value.total_pages)
      }
    })

    if (allImages.length === 0) {
      console.log("[v0] No results from APIs, using fallback images")
      return getFallbackImages(customQuery, page, perPage, source)
    }

    if (source === "all" && allImages.length > perPage) {
      allImages = allImages.slice(0, perPage)
    }

    console.log("[v0] Total images found:", allImages.length)
    return NextResponse.json({
      images: allImages,
      total: totalResults,
      total_pages: totalPages,
      current_page: page,
    })
  } catch (error) {
    console.error("[v0] Critical error in search-images API:", error)
    const customQuery = new URL(request.url).searchParams.get("query") || "nature"
    const page = Number.parseInt(new URL(request.url).searchParams.get("page") || "1")
    const perPage = Number.parseInt(new URL(request.url).searchParams.get("per_page") || "8")
    const source = new URL(request.url).searchParams.get("source") || "all"
    return getFallbackImages(customQuery, page, perPage, source)
  }
}

async function fetchUnsplash(query: string, page: number, perPage: number, apiKey?: string) {
  if (!apiKey || apiKey === "demo" || apiKey.trim() === "" || apiKey === "undefined") {
    console.log("[v0] No valid Unsplash API key found")
    return null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape&content_filter=high&client_id=${apiKey}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log("[v0] Unsplash API response not ok:", response.status)
      return null
    }

    const data = await response.json()
    console.log("[v0] Unsplash API response:", data.results?.length || 0, "images found")

    const images =
      data.results?.map((item: any, index: number) => ({
        src: item.urls.regular,
        name: item.alt_description || item.description || `${query} View ${index + 1}`,
        location: `Search: ${query}`,
        thumbnail: item.urls.small, // Using higher quality small URL instead of thumb for better clarity
        source: "unsplash",
        metadata: {
          photographer: item.user?.name || "Unknown",
          likes: item.likes || 0,
          downloads: item.downloads || 0,
          views: item.views || 0,
          tags: item.tags?.slice(0, 3).map((tag: any) => tag.title) || [],
        },
      })) || []

    return {
      images,
      total: data.total || 0,
      total_pages: data.total_pages || 1,
    }
  } catch (error) {
    console.error("[v0] Error fetching from Unsplash:", error)
    return null
  }
}

async function fetchPexels(query: string, page: number, perPage: number, apiKey?: string) {
  if (!apiKey || apiKey === "demo" || apiKey.trim() === "" || apiKey === "undefined") {
    console.log("[v0] No valid Pexels API key found")
    return null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log("[v0] Pexels API response not ok:", response.status)
      return null
    }

    const data = await response.json()
    console.log("[v0] Pexels API response:", data.photos?.length || 0, "images found")

    const images =
      data.photos?.map((item: any, index: number) => ({
        src: item.src.large,
        name: item.alt || `${query} Photo ${index + 1}`,
        location: `Search: ${query}`,
        thumbnail: item.src.medium, // Using medium quality URL instead of small for better clarity
        source: "pexels",
        metadata: {
          photographer: item.photographer || "Unknown",
          likes: 0,
          downloads: 0,
          views: 0,
          tags: [],
        },
      })) || []

    return {
      images,
      total: data.total_results || 0,
      total_pages: Math.ceil((data.total_results || 0) / perPage),
    }
  } catch (error) {
    console.error("[v0] Error fetching from Pexels:", error)
    return null
  }
}

function getFallbackImages(query: string, page = 1, perPage = 8, source = "all") {
  const searchFallbackImages = Array.from({ length: 24 }, (_, i) => ({
    src: `/placeholder.svg?height=400&width=600&query=${query} ${["beautiful", "scenic", "artistic", "stunning", "amazing", "breathtaking"][i % 6]} ${["landscape", "nature", "view", "vista", "scene", "photo"][i % 6]}`,
    name: `${query} ${["Landscape", "Nature", "Art", "Vista", "Scene", "Photo"][i % 6]} ${i + 1}`,
    location: `Search: ${query}`,
    source: source === "all" ? (i % 2 === 0 ? "unsplash" : "pexels") : source, // Added source to fallback
    metadata: {
      photographer: [
        "Search Explorer",
        "Nature Seeker",
        "Art Photographer",
        "Vista Hunter",
        "Scene Capturer",
        "Photo Artist",
      ][i % 6],
      likes: Math.floor(Math.random() * 2000) + 500,
      downloads: Math.floor(Math.random() * 1000) + 300,
      views: Math.floor(Math.random() * 25000) + 5000,
      tags: query.split(" ").slice(0, 3),
    },
  }))

  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const paginatedImages = searchFallbackImages.slice(startIndex, endIndex)

  console.log(`[v0] Using search fallback images for ${query}, page ${page}`)
  return NextResponse.json({
    images: paginatedImages,
    total: searchFallbackImages.length,
    total_pages: Math.ceil(searchFallbackImages.length / perPage),
    current_page: page,
  })
}
