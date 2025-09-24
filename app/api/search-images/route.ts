import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const customQuery = searchParams.get("query")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const perPage = Number.parseInt(searchParams.get("per_page") || "8")

    if (!city && !customQuery) {
      return NextResponse.json({ error: "City or query parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.UNSPLASH_ACCESS_KEY

    if (!apiKey || apiKey === "demo" || apiKey.trim() === "" || apiKey === "undefined") {
      console.log("[v0] No valid Unsplash API key found, using fallback images")
      return getFallbackImages(city || "Search Results", customQuery, page, perPage)
    }

    try {
      const searchQuery = customQuery || `${city} nature landscape`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${perPage}&page=${page}&orientation=landscape&content_filter=high&client_id=${apiKey}`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log("[v0] Unsplash API response not ok:", response.status, response.statusText)
        return getFallbackImages(city || "Search Results", customQuery, page, perPage)
      }

      const data = await response.json()
      console.log("[v0] Unsplash API response:", data.results?.length || 0, "images found")

      const images =
        data.results?.map((item: any, index: number) => ({
          src: item.urls.regular,
          name: item.alt_description || item.description || `${customQuery || city} View ${index + 1}`,
          location: customQuery ? `Search: ${customQuery}` : `${city}`,
          thumbnail: item.urls.thumb,
          metadata: {
            photographer: item.user?.name || "Unknown",
            likes: item.likes || 0,
            downloads: item.downloads || 0,
            views: item.views || 0,
            tags: item.tags?.slice(0, 3).map((tag: any) => tag.title) || [],
          },
        })) || []

      console.log("[v0] Processed images:", images.length)
      return NextResponse.json({
        images,
        total: data.total || 0,
        total_pages: data.total_pages || 1,
        current_page: page,
      })
    } catch (fetchError) {
      console.error("[v0] Error fetching from Unsplash:", fetchError)
      return getFallbackImages(city || "Search Results", customQuery, page, perPage)
    }
  } catch (error) {
    console.error("[v0] Critical error in search-images API:", error)
    const city = new URL(request.url).searchParams.get("city") || "Tehran"
    const customQuery = new URL(request.url).searchParams.get("query")
    const page = Number.parseInt(new URL(request.url).searchParams.get("page") || "1")
    const perPage = Number.parseInt(new URL(request.url).searchParams.get("per_page") || "8")
    return getFallbackImages(city, customQuery, page, perPage)
  }
}

function getFallbackImages(city: string, customQuery?: string, page = 1, perPage = 8) {
  const cityImageMap: Record<string, Array<{ src: string; name: string; location: string; metadata: any }>> = {
    Tehran: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Alborz mountains snow peaks`,
        name: `Alborz Mountain Range`,
        location: "Tehran, Iran",
        metadata: {
          photographer: "Nature Photographer",
          likes: 1250,
          downloads: 890,
          views: 15600,
          tags: ["Mountains", "Snow", "Landscape"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Tochal mountain hiking trail`,
        name: `Tochal Peak Trail`,
        location: "Tehran, Iran",
        metadata: {
          photographer: "Mountain Explorer",
          likes: 980,
          downloads: 650,
          views: 12400,
          tags: ["Hiking", "Trail", "Peak"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Darband river valley nature`,
        name: `Darband Valley`,
        location: "Tehran, Iran",
        metadata: {
          photographer: "Valley Wanderer",
          likes: 1100,
          downloads: 720,
          views: 13800,
          tags: ["River", "Valley", "Nature"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Chitgar Lake sunset`,
        name: `Chitgar Lake`,
        location: "Tehran, Iran",
        metadata: {
          photographer: "Sunset Chaser",
          likes: 1450,
          downloads: 950,
          views: 18200,
          tags: ["Lake", "Sunset", "Reflection"],
        },
      },
    ],
    "New York": [
      {
        src: `/placeholder.svg?height=400&width=600&query=Central Park autumn trees lake`,
        name: `Central Park Autumn`,
        location: "New York, USA",
        metadata: {
          photographer: "Urban Nature",
          likes: 2100,
          downloads: 1200,
          views: 25600,
          tags: ["Autumn", "Park", "Trees"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Hudson River valley scenic view`,
        name: `Hudson River Valley`,
        location: "New York, USA",
        metadata: {
          photographer: "River Photographer",
          likes: 1800,
          downloads: 980,
          views: 22400,
          tags: ["River", "Valley", "Scenic"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Adirondack Mountains forest lake`,
        name: `Adirondack Wilderness`,
        location: "New York, USA",
        metadata: {
          photographer: "Wilderness Guide",
          likes: 1650,
          downloads: 890,
          views: 19800,
          tags: ["Forest", "Lake", "Wilderness"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Niagara Falls rainbow mist`,
        name: `Niagara Falls`,
        location: "New York, USA",
        metadata: {
          photographer: "Falls Explorer",
          likes: 3200,
          downloads: 1800,
          views: 45600,
          tags: ["Waterfall", "Rainbow", "Mist"],
        },
      },
    ],
    London: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Hyde Park London green meadow trees`,
        name: `Hyde Park Meadows`,
        location: "London, UK",
        metadata: {
          photographer: "London Explorer",
          likes: 1400,
          downloads: 780,
          views: 16800,
          tags: ["Park", "Meadow", "Green"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Richmond Park deer ancient oak trees`,
        name: `Richmond Park`,
        location: "London, UK",
        metadata: {
          photographer: "Wildlife Photographer",
          likes: 1900,
          downloads: 1100,
          views: 23400,
          tags: ["Deer", "Oak", "Wildlife"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Thames River countryside rolling hills`,
        name: `Thames Valley`,
        location: "London, UK",
        metadata: {
          photographer: "Countryside Lover",
          likes: 1300,
          downloads: 720,
          views: 15600,
          tags: ["Thames", "Hills", "Countryside"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Hampstead Heath pond wildflowers`,
        name: `Hampstead Heath`,
        location: "London, UK",
        metadata: {
          photographer: "Heath Walker",
          likes: 1150,
          downloads: 650,
          views: 14200,
          tags: ["Heath", "Pond", "Wildflowers"],
        },
      },
    ],
    Kelardasht: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht rice fields green terraces`,
        name: `Rice Terraces`,
        location: "Kelardasht, Iran",
        metadata: {
          photographer: "Rice Field Artist",
          likes: 1600,
          downloads: 890,
          views: 19200,
          tags: ["Rice", "Terraces", "Green"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht Caspian forest misty mountains`,
        name: `Caspian Forest`,
        location: "Kelardasht, Iran",
        metadata: {
          photographer: "Forest Mystic",
          likes: 1850,
          downloads: 1050,
          views: 22800,
          tags: ["Forest", "Misty", "Caspian"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht tea plantation hills sunrise`,
        name: `Tea Plantation Hills`,
        location: "Kelardasht, Iran",
        metadata: {
          photographer: "Tea Plantation Guide",
          likes: 1400,
          downloads: 780,
          views: 17600,
          tags: ["Tea", "Plantation", "Sunrise"],
        },
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht waterfall rocks moss`,
        name: `Mountain Waterfall`,
        location: "Kelardasht, Iran",
        metadata: {
          photographer: "Waterfall Hunter",
          likes: 1750,
          downloads: 950,
          views: 21400,
          tags: ["Waterfall", "Rocks", "Moss"],
        },
      },
    ],
  }

  if (customQuery) {
    const searchFallbackImages = Array.from({ length: 24 }, (_, i) => ({
      src: `/placeholder.svg?height=400&width=600&query=${customQuery} ${["beautiful", "scenic", "artistic", "stunning", "amazing", "breathtaking"][i % 6]} ${["landscape", "nature", "view", "vista", "scene", "photo"][i % 6]}`,
      name: `${customQuery} ${["Landscape", "Nature", "Art", "Vista", "Scene", "Photo"][i % 6]} ${i + 1}`,
      location: `Search: ${customQuery}`,
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
        tags: customQuery.split(" ").slice(0, 3),
      },
    }))

    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedImages = searchFallbackImages.slice(startIndex, endIndex)

    console.log(`[v0] Using search fallback images for ${customQuery}, page ${page}`)
    return NextResponse.json({
      images: paginatedImages,
      total: searchFallbackImages.length,
      total_pages: Math.ceil(searchFallbackImages.length / perPage),
      current_page: page,
    })
  }

  const fallbackImages = cityImageMap[city] || [
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} nature landscape beautiful scenery`,
      name: `${city} Nature Vista`,
      location: city,
      metadata: {
        photographer: "Nature Photographer",
        likes: 1200,
        downloads: 800,
        views: 15000,
        tags: ["Nature", "Landscape", "Vista"],
      },
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} scenic mountain view`,
      name: `${city} Scenic View`,
      location: city,
      metadata: {
        photographer: "Scenic Explorer",
        likes: 950,
        downloads: 600,
        views: 12000,
        tags: ["Scenic", "Mountain", "View"],
      },
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} beautiful park garden`,
      name: `${city} Garden Paradise`,
      location: city,
      metadata: {
        photographer: "Garden Artist",
        likes: 1100,
        downloads: 700,
        views: 14000,
        tags: ["Garden", "Paradise", "Beautiful"],
      },
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} sunset cityscape`,
      name: `${city} Golden Hour`,
      location: city,
      metadata: {
        photographer: "Golden Hour Photographer",
        likes: 1800,
        downloads: 1000,
        views: 20000,
        tags: ["Sunset", "Golden", "Hour"],
      },
    },
  ]

  console.log("[v0] Using fallback images for", city)
  return NextResponse.json({ images: fallbackImages })
}
