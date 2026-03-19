// Type definitions for Next.js routes

/**
 * Internal types used by the Next.js router and Link component.
 * These types are not meant to be used directly.
 * @internal
 */
declare namespace __next_route_internal_types__ {
  type SearchOrHash = `?${string}` | `#${string}`
  type WithProtocol = `${string}:${string}`

  type Suffix = '' | SearchOrHash

  type SafeSlug<S extends string> = S extends `${string}/${string}`
    ? never
    : S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type CatchAllSlug<S extends string> = S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type OptionalCatchAllSlug<S extends string> =
    S extends `${string}${SearchOrHash}` ? never : S

  type StaticRoutes = 
    | `/`
    | `/admin`
    | `/admin/ai-settings`
    | `/admin/anniversary-30th`
    | `/admin/auctions`
    | `/admin/bids`
    | `/admin/eevee-day`
    | `/admin/events`
    | `/admin/announcements`
    | `/admin/payments`
    | `/admin/items`
    | `/admin/messages`
    | `/admin/deliveries`
    | `/admin/notifications`
    | `/admin/members`
    | `/admin/popularity`
    | `/admin/registrations`
    | `/admin/virtual-comments`
    | `/admin/public-image`
    | `/anniversary-30th`
    | `/anniversary-30th/battle`
    | `/anniversary-30th/price`
    | `/anniversary-30th/reveal`
    | `/api/admin/ai-settings`
    | `/api/admin/announcements/toggle`
    | `/api/admin/announcements/reads`
    | `/api/admin/check-env`
    | `/api/admin/create-time-rift-auctions`
    | `/api/admin/deliveries`
    | `/api/admin/deliveries/users`
    | `/api/admin/eevee-day`
    | `/api/admin/items`
    | `/api/admin/items/users`
    | `/api/admin/members/role`
    | `/api/admin/payments`
    | `/api/admin/payments/users`
    | `/api/admin/popularity`
    | `/api/admin/registrations/create`
    | `/api/admin/run-migration-039`
    | `/api/admin/virtual-comments`
    | `/api/admin/anniversary-30th/contracts/delivery`
    | `/api/admin/anniversary-30th/route`
    | `/api/admin/anniversary-30th/participants`
    | `/api/anniversary-30th/additional/pay`
    | `/api/anniversary-30th/battle/play`
    | `/api/anniversary-30th/battle/start`
    | `/api/anniversary-30th/price`
    | `/api/anniversary-30th/reveal`
    | `/api/anniversary-30th/join`
    | `/api/check-in`
    | `/api/check-in/goal`
    | `/api/cron/auto-auction`
    | `/api/cron/update-points`
    | `/api/cron/virtual-visits`
    | `/api/debug/registrations`
    | `/api/eevee-day/quiz`
    | `/api/eevee-day/reward`
    | `/api/eevee-day/status`
    | `/api/events`
    | `/api/announcements/read`
    | `/api/announcements/read-status`
    | `/api/follow`
    | `/api/follow/list`
    | `/api/games/roulette`
    | `/api/games/crash`
    | `/api/generate-reply`
    | `/api/comments/reactions`
    | `/api/generate-spontaneous`
    | `/api/generate-homepage-comment`
    | `/api/me/history`
    | `/api/me/profile`
    | `/api/popularity`
    | `/auctions`
    | `/check-in`
    | `/collection`
    | `/deliveries`
    | `/eevee-day`
    | `/eevee-day/quiz`
    | `/events`
    | `/games`
    | `/games/crash`
    | `/games/risk-box`
    | `/games/scratch`
    | `/games/roulette`
    | `/guides`
    | `/history`
    | `/items`
    | `/login`
    | `/logout`
    | `/messages`
    | `/payments`
    | `/pokedex`
    | `/privacy`
    | `/profile`
    | `/announcements`
    | `/rankings`
    | `/shop`
    | `/signup`
  type DynamicRoutes<T extends string = string> = 
    | `/admin/events/${SafeSlug<T>}`
    | `/admin/announcements/${SafeSlug<T>}`
    | `/admin/registrations/${SafeSlug<T>}`
    | `/api/admin/deliveries/${SafeSlug<T>}`
    | `/api/admin/items/${SafeSlug<T>}`
    | `/api/admin/payments/${SafeSlug<T>}`
    | `/api/admin/registrations/${SafeSlug<T>}/status`
    | `/api/admin/registrations/${SafeSlug<T>}/time`
    | `/api/events/${SafeSlug<T>}`
    | `/api/events/${SafeSlug<T>}/draw`
    | `/api/events/${SafeSlug<T>}/register`
    | `/api/comments/${SafeSlug<T>}/react`
    | `/auctions/${SafeSlug<T>}`
    | `/events/${SafeSlug<T>}`
    | `/events/${SafeSlug<T>}/draw`
    | `/announcements/${SafeSlug<T>}`
    | `/user/${SafeSlug<T>}`

  type RouteImpl<T> = 
    | StaticRoutes
    | SearchOrHash
    | WithProtocol
    | `${StaticRoutes}${SearchOrHash}`
    | (T extends `${DynamicRoutes<infer _>}${Suffix}` ? T : never)
    
}

declare module 'next' {
  export { default } from 'next/types/index.js'
  export * from 'next/types/index.js'

  export type Route<T extends string = string> =
    __next_route_internal_types__.RouteImpl<T>
}

declare module 'next/link' {
  import type { LinkProps as OriginalLinkProps } from 'next/dist/client/link.js'
  import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'
  import type { UrlObject } from 'url'

  type LinkRestProps = Omit<
    Omit<
      DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >,
      keyof OriginalLinkProps
    > &
      OriginalLinkProps,
    'href'
  >

  export type LinkProps<RouteInferType> = LinkRestProps & {
    /**
     * The path or URL to navigate to. This is the only required prop. It can also be an object.
     * @see https://nextjs.org/docs/api-reference/next/link
     */
    href: __next_route_internal_types__.RouteImpl<RouteInferType> | UrlObject
  }

  export default function Link<RouteType>(props: LinkProps<RouteType>): JSX.Element
}

declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation.js'

  import type { NavigateOptions, AppRouterInstance as OriginalAppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
  interface AppRouterInstance extends OriginalAppRouterInstance {
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Prefetch the provided href.
     */
    prefetch<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>): void
  }

  export declare function useRouter(): AppRouterInstance;
}
