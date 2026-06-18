"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn, getInitials, avatarGradient } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
} as const

export type AvatarSize = keyof typeof sizeMap

/**
 * High-level avatar: shows the image when available, otherwise a deterministic
 * gradient with initials. Use this across the app instead of hand-rolling
 * initials circles.
 */
function UserAvatar({
  name,
  email,
  src,
  size = "md",
  className,
  ...props
}: {
  name?: string | null
  email?: string | null
  src?: string | null
  size?: AvatarSize
  className?: string
} & React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  const seed = name || email || ""
  const initials = getInitials(name || email)
  return (
    <Avatar className={cn(sizeMap[size], "font-semibold", className)} {...props}>
      {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
      <AvatarFallback
        className="text-white"
        style={{ backgroundImage: avatarGradient(seed) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar }
