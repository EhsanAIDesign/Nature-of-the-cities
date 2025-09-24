import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")

    if (!city) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.UNSPLASH_ACCESS_KEY

    if (!apiKey || apiKey === "demo" || apiKey.trim() === "" || apiKey === "undefined") {
      console.log("[v0] No valid Unsplash API key found, using fallback images")
      return getFallbackImages(city)
    }

    try {
      const searchQuery = `${city} nature landscape`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=6&orientation=landscape&content_filter=high&client_id=${apiKey}`,
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
        return getFallbackImages(city)
      }

      const data = await response.json()
      console.log("[v0] Unsplash API response:", data.results?.length || 0, "images found")

      // Transform the response to match our expected format
      const images =
        data.results?.slice(0, 4).map((item: any, index: number) => ({
          src: item.urls.regular,
          name: item.alt_description || item.description || `${city} Nature View ${index + 1}`,
          location: `${city}`,
          thumbnail: item.urls.thumb,
        })) || []

      console.log("[v0] Processed images:", images.length)
      return NextResponse.json({ images })
    } catch (fetchError) {
      console.error("[v0] Error fetching from Unsplash:", fetchError)
      return getFallbackImages(city)
    }
  } catch (error) {
    console.error("[v0] Critical error in search-images API:", error)
    const city = new URL(request.url).searchParams.get("city") || "Tehran"
    return getFallbackImages(city)
  }
}

function getFallbackImages(city: string) {
  const cityImageMap: Record<string, Array<{ src: string; name: string; location: string }>> = {
    Tehran: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Alborz mountains snow peaks`,
        name: `Alborz Mountain Range`,
        location: "Tehran, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Tochal mountain hiking trail`,
        name: `Tochal Peak Trail`,
        location: "Tehran, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Darband river valley nature`,
        name: `Darband Valley`,
        location: "Tehran, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Tehran Chitgar Lake sunset`,
        name: `Chitgar Lake`,
        location: "Tehran, Iran",
      },
    ],
    "New York": [
      {
        src: `/placeholder.svg?height=400&width=600&query=Central Park autumn trees lake`,
        name: `Central Park Autumn`,
        location: "New York, USA",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Hudson River valley scenic view`,
        name: `Hudson River Valley`,
        location: "New York, USA",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Adirondack Mountains forest lake`,
        name: `Adirondack Wilderness`,
        location: "New York, USA",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Niagara Falls rainbow mist`,
        name: `Niagara Falls`,
        location: "New York, USA",
      },
    ],
    London: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Hyde Park London green meadow trees`,
        name: `Hyde Park Meadows`,
        location: "London, UK",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Richmond Park deer ancient oak trees`,
        name: `Richmond Park`,
        location: "London, UK",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Thames River countryside rolling hills`,
        name: `Thames Valley`,
        location: "London, UK",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Hampstead Heath pond wildflowers`,
        name: `Hampstead Heath`,
        location: "London, UK",
      },
    ],
    Kelardasht: [
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht rice fields green terraces`,
        name: `Rice Terraces`,
        location: "Kelardasht, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht Caspian forest misty mountains`,
        name: `Caspian Forest`,
        location: "Kelardasht, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht tea plantation hills sunrise`,
        name: `Tea Plantation Hills`,
        location: "Kelardasht, Iran",
      },
      {
        src: `/placeholder.svg?height=400&width=600&query=Kelardasht waterfall rocks moss`,
        name: `Mountain Waterfall`,
        location: "Kelardasht, Iran",
      },
    ],
  }

  const fallbackImages = cityImageMap[city] || [
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} nature landscape beautiful scenery`,
      name: `${city} Nature Vista`,
      location: city,
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} scenic mountain view`,
      name: `${city} Scenic View`,
      location: city,
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} beautiful park garden`,
      name: `${city} Garden Paradise`,
      location: city,
    },
    {
      src: `/placeholder.svg?height=400&width=600&query=${city} sunset cityscape`,
      name: `${city} Golden Hour`,
      location: city,
    },
  ]

  console.log("[v0] Using fallback images for", city)
  return NextResponse.json({ images: fallbackImages })
}
