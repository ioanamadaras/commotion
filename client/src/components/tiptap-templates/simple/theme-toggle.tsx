import { useEffect, useState } from "react"
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getResolvedTheme() {
  const current = document.documentElement.getAttribute("data-theme")
  if (current === "dark" || current === "light") {
    return current
  }

  return getSystemTheme()
}

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const applyCurrentTheme = () => {
      const dark = getResolvedTheme() === "dark"
      setIsDarkMode(dark)
      document.documentElement.classList.toggle("dark", dark)
    }

    applyCurrentTheme()

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (!document.documentElement.hasAttribute("data-theme")) {
        applyCurrentTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light"

    document.documentElement.setAttribute("data-theme", theme)
    document.documentElement.classList.toggle("dark", isDarkMode)

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()
      )
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      variant="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
