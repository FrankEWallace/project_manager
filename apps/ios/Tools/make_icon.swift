// Generates the 1024×1024 app icon as a PNG using CoreGraphics.
// Run:  swift Tools/make_icon.swift
// Produces: Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png
//
// Design: indigo vertical gradient background (full-bleed, no rounded corners —
// iOS masks them) with a white "layered stack" mark (three offset rounded bars)
// representing projects/phases stacking up.

import AppKit
import CoreGraphics
import Foundation

let size = 1024
let cs = CGColorSpaceCreateDeviceRGB()

guard let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else { fatalError("ctx") }

let rect = CGRect(x: 0, y: 0, width: size, height: size)

// Background gradient: indigo 0x6366F1 -> deeper 0x4338CA (top to bottom).
func rgb(_ hex: UInt32) -> [CGFloat] {
    [CGFloat((hex >> 16) & 0xff) / 255, CGFloat((hex >> 8) & 0xff) / 255, CGFloat(hex & 0xff) / 255, 1]
}
let grad = CGGradient(colorSpace: cs,
                      colorComponents: rgb(0x6366F1) + rgb(0x4338CA),
                      locations: [0, 1], count: 2)!
ctx.drawLinearGradient(grad,
                       start: CGPoint(x: 0, y: size),
                       end: CGPoint(x: 0, y: 0),
                       options: [])

// Layered-stack mark: three rounded bars, each offset/narrowing upward.
let bars: [(y: CGFloat, w: CGFloat, alpha: CGFloat)] = [
    (320, 520, 1.00),   // bottom, widest, full white
    (470, 440, 0.78),
    (600, 360, 0.55),   // top, narrowest, faintest
]
let barHeight: CGFloat = 110
let radius: CGFloat = 38

for bar in bars {
    let x = (CGFloat(size) - bar.w) / 2
    let r = CGRect(x: x, y: bar.y, width: bar.w, height: barHeight)
    let path = CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil)
    ctx.addPath(path)
    ctx.setFillColor(CGColor(srgbRed: 1, green: 1, blue: 1, alpha: bar.alpha))
    ctx.fillPath()
}

guard let image = ctx.makeImage() else { fatalError("image") }
let rep = NSBitmapImageRep(cgImage: image)
guard let png = rep.representation(using: .png, properties: [:]) else { fatalError("png") }

let out = URL(fileURLWithPath: "Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png")
try! png.write(to: out)
print("Wrote \(out.path)")
