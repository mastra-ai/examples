"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateOpenApiSpec } from "@/actions"
import { CodeBlock } from "../ui/codeblock"

interface PredefinedUrl {
  label: string
  value: string
}

interface OpenApiInfo {
  title: string
  version: string
  description: string
}

interface OpenApiParameter {
  name: string
  in: string
  description: string
  required: boolean
}

interface OpenApiPath {
  summary: string
  description?: string
  parameters?: OpenApiParameter[]
  responses?: Record<string, { description: string }>
}

interface OpenApiSpec {
  openapi: string
  info: OpenApiInfo
  paths: Record<
    string,
    {
      get?: OpenApiPath
      post?: OpenApiPath
      put?: OpenApiPath
      delete?: OpenApiPath
    }
  >
}

interface CodeLineProps {
  line: string
}

interface CodeEditorProps {
  code: string
}

const CodeLine: React.FC<CodeLineProps> = ({ line }) => {
  const tokens = line
    .split(/([{}[\],]|"(?:\\.|[^"\\])*"|\b(?:true|false|null|\d+)\b|\s+)/g)
    .filter(Boolean)

  return (
    <div className="leading-6 text-sm">
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>
        } else if (/^".*":$/.test(token)) {
          return (
            <span key={i} className="text-yellow-300">
              {token}
            </span>
          )
        } else if (/^".*"$/.test(token)) {
          return (
            <span key={i} className="text-green-300">
              {token}
            </span>
          )
        } else if (/^-?\d+\.?\d*$/.test(token)) {
          return (
            <span key={i} className="text-blue-300">
              {token}
            </span>
          )
        } else if (/^(true|false|null)$/.test(token)) {
          return (
            <span key={i} className="text-blue-300">
              {token}
            </span>
          )
        } else if (/^[{}[\],]$/.test(token)) {
          return (
            <span key={i} className="text-gray-500">
              {token}
            </span>
          )
        } else {
          return <span key={i}>{token}</span>
        }
      })}
    </div>
  )
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  const lines = code.split("\n")
  const lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1)

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="ml-4 bg-gray-700 text-gray-300 px-3 py-1 rounded-md text-sm">
          openapi.json
        </div>
      </div>
      <div className="overflow-auto max-h-[500px]">
        <div className="flex">
          <div className="py-4 pr-4 pl-4 text-gray-500 select-none bg-gray-800 text-right">
            {lineNumbers.map((num) => (
              <div key={num} className="leading-6 text-sm">
                {num}
              </div>
            ))}
          </div>
          <pre className="flex-1 p-4 overflow-auto text-gray-300">
            <code>
              {lines.map((line, i) => (
                <CodeLine key={i} line={line} />
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

const OpenApiGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedUrl, setSelectedUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [openApiSpec, setOpenApiSpec] = useState("")
  const comboboxRef = useRef<HTMLDivElement>(null)

  const predefinedUrls: PredefinedUrl[] = [
    {
      label: "Browserbase",
      value: "https://docs.browserbase.com/reference/api",
    },
  ]

  const filteredOptions = predefinedUrls.filter(
    (option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = async (): Promise<void> => {
    const urlToSubmit = selectedUrl || inputValue
    if (!urlToSubmit) {
      setError("Please enter a valid URL")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await generateOpenApiSpec({ url: urlToSubmit })

      setOpenApiSpec(res.data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while generating the specification"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="space-y-4">
        <div className="flex gap-2 items-start">
          <div className="relative flex-1" ref={comboboxRef}>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setSelectedUrl("")
                  if (!isOpen) setIsOpen(true)
                }}
                onClick={() => setIsOpen(true)}
                placeholder="Search or enter API documentation URL..."
                className="w-full px-4 py-2 pr-8 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {isOpen && (
              <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => {
                        setInputValue(option.value)
                        setSelectedUrl(option.value)
                        setIsOpen(false)
                      }}
                      type="button"
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-gray-500">
                        {option.value}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    Press Enter to use this URL
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !inputValue}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200 text-red-800 p-4 rounded-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {openApiSpec && <CodeBlock value={openApiSpec} language="yaml" />}
      </div>
    </div>
  )
}

export default OpenApiGenerator
