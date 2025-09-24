"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Download, Loader2, Camera, Heart, Eye, Hash, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageData {
  src: string
  name: string
  location: string
  thumbnail?: string
  metadata?: {
    photographer: string
    likes: number
    downloads: number
    views: number
    tags: string[]
  }
}

interface SearchResults {
  images: ImageData[]
  total: number
  total_pages: number
  current_page: number
}

const fallbackImagesByCity = {
  Tehran: [
    {
      src: "/mountain-landscape.png",
      name: "Alborz Mountain Range",
      location: "Tehran Province, Iran",
      metadata: {
        photographer: "Mountain Explorer",
        likes: 1250,
        downloads: 890,
        views: 15600,
        tags: ["Mountains", "Snow", "Landscape"],
      },
    },
    {
      src: "/serene-ocean-sunset.jpg",
      name: "Golestan Palace Gardens",
      location: "Tehran, Iran",
      metadata: {
        photographer: "Palace Photographer",
        likes: 980,
        downloads: 650,
        views: 12400,
        tags: ["Palace", "Gardens", "Historic"],
      },
    },
  ],
  "New York": [
    {
      src: "/vibrant-city-skyline-at-night.jpg",
      name: "Manhattan Skyline",
      location: "New York City, USA",
      metadata: {
        photographer: "City Lights",
        likes: 2100,
        downloads: 1200,
        views: 25600,
        tags: ["Skyline", "Night", "Manhattan"],
      },
    },
    {
      src: "/peaceful-forest-with-tall-trees.jpg",
      name: "Central Park Vista",
      location: "Manhattan, New York",
      metadata: {
        photographer: "Park Explorer",
        likes: 1800,
        downloads: 980,
        views: 22400,
        tags: ["Park", "Trees", "Nature"],
      },
    },
  ],
  London: [
    {
      src: "/mountain-landscape.png",
      name: "Thames River View",
      location: "London, England",
      metadata: {
        photographer: "Thames Walker",
        likes: 1400,
        downloads: 780,
        views: 16800,
        tags: ["Thames", "River", "London"],
      },
    },
    {
      src: "/serene-ocean-sunset.jpg",
      name: "Hyde Park Sunset",
      location: "London, England",
      metadata: {
        photographer: "Sunset Chaser",
        likes: 1900,
        downloads: 1100,
        views: 23400,
        tags: ["Hyde Park", "Sunset", "Golden"],
      },
    },
  ],
  Kelardasht: [
    {
      src: "/peaceful-forest-with-tall-trees.jpg",
      name: "Caspian Forest",
      location: "Kelardasht, Mazandaran",
      metadata: {
        photographer: "Forest Mystic",
        likes: 1600,
        downloads: 890,
        views: 19200,
        tags: ["Forest", "Caspian", "Trees"],
      },
    },
    {
      src: "/mountain-landscape.png",
      name: "Damavand Peak View",
      location: "Kelardasht, Iran",
      metadata: {
        photographer: "Peak Climber",
        likes: 1850,
        downloads: 1050,
        views: 22800,
        tags: ["Damavand", "Peak", "Mountain"],
      },
    },
  ],
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string>("Tehran")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [cityImages, setCityImages] = useState<ImageData[]>(fallbackImagesByCity.Tehran)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)

  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCityImages = async (city: string, customQuery?: string) => {
    setIsLoadingImages(true)
    try {
      const queryParam = customQuery ? `query=${encodeURIComponent(customQuery)}` : `city=${encodeURIComponent(city)}`
      const response = await fetch(`/api/search-images?${queryParam}`)

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
    setSearchQuery("") // Clear search query when city changes

    // Fetch new images for the selected city
    await fetchCityImages(city)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }

  const fetchSearchResults = async (query: string, page = 1) => {
    setIsLoadingSearch(true)
    try {
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&page=${page}&per_page=8`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text())
        throw new Error("Invalid response format")
      }

      const data = await response.json()
      setSearchResults(data)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching search results:", error)
      // Set empty results on error
      setSearchResults({
        images: [],
        total: 0,
        total_pages: 0,
        current_page: page,
      })
    } finally {
      setIsLoadingSearch(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    await fetchSearchResults(searchQuery, 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && searchQuery.trim()) {
      fetchSearchResults(searchQuery, currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (searchResults && currentPage < searchResults.total_pages && searchQuery.trim()) {
      fetchSearchResults(searchQuery, currentPage + 1)
    }
  }

  const selectSearchImage = (image: ImageData, index: number) => {
    setCityImages([image])
    setCurrentImageIndex(0)
    setIsTransitioning(true)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const currentImage = cityImages[currentImageIndex]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left Column - Search Results */}
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-6">
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    size="default"
                    disabled={!searchQuery.trim() || isLoadingSearch}
                    className="px-3"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {searchResults && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Search Results</h3>
                      <span className="text-sm text-muted-foreground">{searchResults.total} results found</span>
                    </div>

                    {isLoadingSearch ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {searchResults.images.map((image, index) => (
                            <div
                              key={index}
                              className="aspect-[4/3] overflow-hidden rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => selectSearchImage(image, index)}
                            >
                              <img
                                src={image.thumbnail || image.src}
                                alt={image.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>

                        {searchResults.total_pages > 1 && (
                          <div className="flex items-center justify-between">
                            <Button
                              onClick={handlePrevPage}
                              disabled={currentPage <= 1 || isLoadingSearch}
                              variant="outline"
                              size="sm"
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous
                            </Button>

                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} of {searchResults.total_pages}
                            </span>

                            <Button
                              onClick={handleNextPage}
                              disabled={currentPage >= searchResults.total_pages || isLoadingSearch}
                              variant="outline"
                              size="sm"
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - City Images */}
            <div className="space-y-4 pt-6 lg:pt-0 lg:pl-6">
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Select value={selectedCity} onValueChange={handleCityChange}>
                      <SelectTrigger className="w-48">
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
                    {currentImage?.metadata && (
                      <div className="flex flex-wrap gap-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          <Camera className="w-3 h-3" />
                          {currentImage.metadata.photographer}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          <Heart className="w-3 h-3" />
                          {currentImage.metadata.likes.toLocaleString()}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                          <Eye className="w-3 h-3" />
                          {currentImage.metadata.views.toLocaleString()}
                        </div>
                        {currentImage.metadata.tags.slice(0, 2).map((tag, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                          >
                            <Hash className="w-3 h-3" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
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
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
