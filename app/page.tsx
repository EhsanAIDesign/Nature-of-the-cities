"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { MapPin, Download, Loader2, Camera, Heart, Eye, Hash, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageData {
  src: string
  name: string
  location: string
  thumbnail?: string
  source: "unsplash" | "pexels"
  downloadUrl?: string
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

const GOOGLE_FONTS = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "Poppins",
  "Merriweather",
  "Playfair Display",
  "Ubuntu",
  "Nunito",
  "PT Sans",
  "Bebas Neue",
  "Dancing Script",
  "Pacifico",
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)

  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sourceFilter, setSourceFilter] = useState<"all" | "unsplash" | "pexels">("all")

  const [overlayColor, setOverlayColor] = useState("#000000")
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [overlayText, setOverlayText] = useState("")
  const [selectedFont, setSelectedFont] = useState("Roboto")
  const [fontLoaded, setFontLoaded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const currentImage = searchResults?.images[selectedImageIndex]

  useEffect(() => {
    const loadFont = async () => {
      setFontLoaded(false)
      const link = document.createElement("link")
      link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, "+")}:wght@400;700&display=swap`
      link.rel = "stylesheet"
      document.head.appendChild(link)

      await document.fonts.load(`700 48px "${selectedFont}"`)
      setFontLoaded(true)
    }

    loadFont()
  }, [selectedFont])

  useEffect(() => {
    if (!imageRef.current || !canvasRef.current || !currentImage || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imageRef.current

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    ctx.drawImage(img, 0, 0)

    if (overlayOpacity > 0) {
      ctx.fillStyle = overlayColor
      ctx.globalAlpha = overlayOpacity / 100
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1
    }

    if (overlayText.trim() && fontLoaded) {
      const fontSize = Math.max(canvas.width / 15, 32)
      ctx.font = `700 ${fontSize}px "${selectedFont}"`
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.fillText(overlayText, canvas.width / 2, canvas.height / 2)
    }
  }, [currentImage, overlayColor, overlayOpacity, overlayText, selectedFont, fontLoaded, imageLoaded])

  const fetchSearchResults = async (query: string, page = 1, source: "all" | "unsplash" | "pexels" = "all") => {
    setIsLoadingSearch(true)
    try {
      const response = await fetch(
        `/api/search-images?query=${encodeURIComponent(query)}&page=${page}&per_page=8&source=${source}`,
      )

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
      setSelectedImageIndex(0)
    } catch (error) {
      console.error("Error fetching search results:", error)
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
    await fetchSearchResults(searchQuery, 1, sourceFilter)
  }

  const handleFilterChange = (filter: "all" | "unsplash" | "pexels") => {
    setSourceFilter(filter)
    if (searchQuery.trim()) {
      fetchSearchResults(searchQuery, 1, filter)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && searchQuery.trim()) {
      fetchSearchResults(searchQuery, currentPage - 1, sourceFilter)
    }
  }

  const handleNextPage = () => {
    if (searchResults && currentPage < searchResults.total_pages && searchQuery.trim()) {
      fetchSearchResults(searchQuery, currentPage + 1, sourceFilter)
    }
  }

  const changeImage = (direction: "next" | "prev") => {
    if (!searchResults || searchResults.images.length === 0) return

    setIsImageLoading(true)
    setIsTransitioning(true)
    setTimeout(() => {
      if (direction === "next") {
        setSelectedImageIndex((prevIndex) => (prevIndex + 1) % searchResults.images.length)
      } else if (direction === "prev") {
        setSelectedImageIndex(
          (prevIndex) => (prevIndex - 1 + searchResults.images.length) % searchResults.images.length,
        )
      }
      setIsTransitioning(false)
    }, 150)
  }

  const selectSearchImage = (index: number) => {
    setImageLoaded(false)
    setSelectedImageIndex(index)
    setIsTransitioning(true)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
    setImageLoaded(true)
  }

  const downloadImage = async () => {
    if (!searchResults || searchResults.images.length === 0 || !canvasRef.current) return

    try {
      const currentImg = searchResults.images[selectedImageIndex]
      const filename = `${currentImg.name.replace(/\s+/g, "_")}_edited.jpg`

      canvasRef.current.toBlob(
        (blob) => {
          if (!blob) return

          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        },
        "image/jpeg",
        0.95,
      )
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 flex flex-col">
        <Card className="p-6 h-full flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border flex-1">
            <div className="space-y-4 pb-6 lg:pb-0 lg:pr-6 flex flex-col flex-1">
              <div className="p-4 space-y-3">
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

                <div className="flex gap-2">
                  <Button
                    variant={sourceFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("all")}
                    className="text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant={sourceFilter === "unsplash" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("unsplash")}
                    className="text-xs"
                  >
                    Unsplash
                  </Button>
                  <Button
                    variant={sourceFilter === "pexels" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("pexels")}
                    className="text-xs"
                  >
                    Pexels
                  </Button>
                </div>
              </div>

              {searchResults && (
                <div className="p-4 flex-1 flex flex-col overflow-hidden">
                  <div className="space-y-4 flex-1 flex flex-col">
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
                        <div className="flex-1 overflow-y-auto">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {searchResults.images.map((image, index) => (
                              <div
                                key={index}
                                className={`aspect-[4/3] overflow-hidden rounded-lg border cursor-pointer transition-all relative ${
                                  selectedImageIndex === index
                                    ? "ring-2 ring-primary"
                                    : "hover:ring-2 hover:ring-primary/50"
                                }`}
                                onClick={() => selectSearchImage(index)}
                              >
                                <img
                                  src={image.thumbnail || image.src}
                                  alt={image.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                      image.source === "unsplash"
                                        ? "bg-black/70 text-white"
                                        : "bg-emerald-500/90 text-white"
                                    }`}
                                  >
                                    {image.source === "unsplash" ? "U" : "P"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {searchResults.total_pages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t">
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

                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold">Image Editor</h4>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="overlay-color" className="text-xs">
                                Overlay Color
                              </Label>
                              <div className="flex gap-2 items-center">
                                <input
                                  id="overlay-color"
                                  type="color"
                                  value={overlayColor}
                                  onChange={(e) => setOverlayColor(e.target.value)}
                                  className="w-12 h-10 rounded border cursor-pointer"
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Opacity</span>
                                    <span>{overlayOpacity}%</span>
                                  </div>
                                  <Slider
                                    value={[overlayOpacity]}
                                    onValueChange={(value) => setOverlayOpacity(value[0])}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="overlay-text" className="text-xs">
                                Text
                              </Label>
                              <Input
                                id="overlay-text"
                                placeholder="Enter text to overlay..."
                                value={overlayText}
                                onChange={(e) => setOverlayText(e.target.value)}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="font-select" className="text-xs">
                                Font
                              </Label>
                              <Select value={selectedFont} onValueChange={setSelectedFont}>
                                <SelectTrigger id="font-select" className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GOOGLE_FONTS.map((font) => (
                                    <SelectItem key={font} value={font} className="text-sm">
                                      {font}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-6 lg:pt-0 lg:pl-6">
              <div className="p-6">
                {searchResults && searchResults.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border relative">
                      {isImageLoading && (
                        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
                          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isTransitioning ? "opacity-0" : "opacity-100"
                        }`}
                      />
                      <img
                        ref={imageRef}
                        src={currentImage?.src || "/placeholder.svg"}
                        alt={currentImage?.name || "Loading..."}
                        className="hidden"
                        onLoad={handleImageLoad}
                        onLoadStart={() => {
                          setIsImageLoading(true)
                          setImageLoaded(false)
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-left">{currentImage?.name || "Loading..."}</h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{currentImage?.location || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Source:</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            currentImage?.source === "unsplash"
                              ? "bg-black text-white dark:bg-white dark:text-black"
                              : "bg-emerald-500 text-white"
                          }`}
                        >
                          {currentImage?.source === "unsplash" ? "Unsplash" : "Pexels"}
                        </span>
                      </div>
                      {currentImage?.metadata && (
                        <div className="flex flex-wrap gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                            <Camera className="w-3 h-3" />
                            {currentImage.metadata.photographer}
                          </div>
                          {currentImage.metadata.likes > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                              <Heart className="w-3 h-3" />
                              {currentImage.metadata.likes.toLocaleString()}
                            </div>
                          )}
                          {currentImage.metadata.views > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                              <Eye className="w-3 h-3" />
                              {currentImage.metadata.views.toLocaleString()}
                            </div>
                          )}
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
                        disabled={isImageLoading || !searchResults || searchResults.images.length === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => changeImage("next")}
                        className="flex-1 cursor-pointer"
                        size="lg"
                        variant="outline"
                        disabled={isImageLoading || !searchResults || searchResults.images.length === 0}
                      >
                        Next
                      </Button>
                      <Button
                        onClick={downloadImage}
                        size="lg"
                        variant="default"
                        className="px-4 cursor-pointer"
                        disabled={isImageLoading || !searchResults || searchResults.images.length === 0}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <Search className="w-12 h-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Search for Images</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a search term to find beautiful images from Unsplash and Pexels
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
