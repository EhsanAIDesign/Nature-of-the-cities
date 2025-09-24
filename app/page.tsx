"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Download, Loader2 } from "lucide-react"

interface ImageData {
  src: string
  name: string
  location: string
  thumbnail?: string
}

const fallbackImagesByCity = {
  Tehran: [
    {
      src: "/mountain-landscape.png",
      name: "Alborz Mountain Range",
      location: "Tehran Province, Iran",
    },
    {
      src: "/serene-ocean-sunset.jpg",
      name: "Golestan Palace Gardens",
      location: "Tehran, Iran",
    },
  ],
  "New York": [
    {
      src: "/vibrant-city-skyline-at-night.jpg",
      name: "Manhattan Skyline",
      location: "New York City, USA",
    },
    {
      src: "/peaceful-forest-with-tall-trees.jpg",
      name: "Central Park Vista",
      location: "Manhattan, New York",
    },
  ],
  London: [
    {
      src: "/mountain-landscape.png",
      name: "Thames River View",
      location: "London, England",
    },
    {
      src: "/serene-ocean-sunset.jpg",
      name: "Hyde Park Sunset",
      location: "London, England",
    },
  ],
  Kelardasht: [
    {
      src: "/peaceful-forest-with-tall-trees.jpg",
      name: "Caspian Forest",
      location: "Kelardasht, Mazandaran",
    },
    {
      src: "/mountain-landscape.png",
      name: "Damavand Peak View",
      location: "Kelardasht, Iran",
    },
  ],
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string>("Tehran")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [cityImages, setCityImages] = useState<ImageData[]>(fallbackImagesByCity.Tehran)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)

  const fetchCityImages = async (city: string) => {
    setIsLoadingImages(true)
    try {
      const response = await fetch(`/api/search-images?city=${encodeURIComponent(city)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text())
        throw new Error("Invalid response format")
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        setCityImages(data.images)
      } else {
        // Use fallback images if API returns no results
        setCityImages(fallbackImagesByCity[city as keyof typeof fallbackImagesByCity] || fallbackImagesByCity.Tehran)
      }
    } catch (error) {
      console.error("Error fetching images:", error)
      // Use fallback images on error
      setCityImages(fallbackImagesByCity[city as keyof typeof fallbackImagesByCity] || fallbackImagesByCity.Tehran)
    } finally {
      setIsLoadingImages(false)
    }
  }

  useEffect(() => {
    fetchCityImages(selectedCity)
  }, [])

  const changeImage = (direction: "next" | "prev") => {
    setIsImageLoading(true)
    setIsTransitioning(true)
    setTimeout(() => {
      if (direction === "next") {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % cityImages.length)
      } else if (direction === "prev") {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + cityImages.length) % cityImages.length)
      }
      setIsTransitioning(false)
    }, 150)
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const downloadImage = async () => {
    try {
      const currentImg = cityImages[currentImageIndex]
      const filename = `${currentImg.name.replace(/\s+/g, "_")}.jpg`

      console.log("[v0] Starting download for:", currentImg.name)

      // Use our download API to handle CORS and proper downloading
      const downloadUrl = `/api/download-image?url=${encodeURIComponent(currentImg.src)}&filename=${encodeURIComponent(filename)}`

      // Create a temporary link to trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("[v0] Download initiated for:", filename)
    } catch (error) {
      console.error("[v0] Error initiating download:", error)
    }
  }

  const handleCityChange = async (city: string) => {
    setIsTransitioning(true)
    setSelectedCity(city)
    setCurrentImageIndex(0)
    setIsImageLoading(false)

    // Fetch new images for the selected city
    await fetchCityImages(city)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }

  const currentImage = cityImages[currentImageIndex]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="space-y-4">
          <div className="flex justify-start">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tehran">Tehran</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="Kelardasht">Kelardasht</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="aspect-[4/3] overflow-hidden rounded-lg border relative">
            {isLoadingImages && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {isImageLoading && !isLoadingImages && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={currentImage?.src || "/placeholder.svg"}
              alt={currentImage?.name || "Loading..."}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleImageLoad}
              onLoadStart={() => setIsImageLoading(true)}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-left">{currentImage?.name || "Loading..."}</h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{currentImage?.location || selectedCity}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => changeImage("prev")}
              className="flex-1 cursor-pointer"
              size="lg"
              variant="outline"
              disabled={isLoadingImages || isImageLoading}
            >
              Previous
            </Button>
            <Button
              onClick={() => changeImage("next")}
              className="flex-1 cursor-pointer"
              size="lg"
              variant="outline"
              disabled={isLoadingImages || isImageLoading}
            >
              Next
            </Button>
            <Button
              onClick={downloadImage}
              size="lg"
              variant="default"
              className="px-4 cursor-pointer"
              disabled={isLoadingImages || isImageLoading}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
