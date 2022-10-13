import React, { useCallback, useMemo } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import MaintenancePage from "decentraland-gatsby/dist/components/Layout/MaintenancePage"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import ItemLayout from "../components/Layout/ItemLayout"
import Navigation from "../components/Layout/Navigation"
import PlaceDescription from "../components/Place/PlaceDescription/PlaceDescription"
import PlaceDetails from "../components/Place/PlaceDetails/PlaceDetails"
import { usePlaceId } from "../hooks/usePlaceId"
import usePlacesManager from "../hooks/usePlacesManager"
import { FeatureFlags } from "../modules/ff"
import locations from "../modules/locations"
import { SegmentPlace } from "../modules/segment"

export type EventPageState = {
  updating: Record<string, boolean>
}

export default function PlacePage() {
  const l = useFormatMessage()
  const track = useTrackContext()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [account, accountState] = useAuthContext()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [placeRetrived] = usePlaceId(params.get("id"))

  const a = useMemo(() => [[placeRetrived]], [placeRetrived])
  const [
    [[place]],
    {
      handleFavorite,
      handlingFavorite,
      handleLike,
      handlingLike,
      handleDislike,
      handlingDislike,
    },
  ] = usePlacesManager(a)

  const [handlingShare, share] = useAsyncTask(async () => {
    if (place) {
      try {
        const shareableText = place.description
          ? `${place.title} - ${place.description}`
          : place.title
        await (navigator as any).share({
          title: place.title,
          text: `${l("general.place_share")}${shareableText}`,
          url: location.origin + locations.place(place.id),
        })
        track(SegmentPlace.Share, {
          placeId: place.id,
        })
      } catch (err) {
        console.error(err)
      }
    }
  }, [place, track])

  const handleShare = useCallback((e: React.MouseEvent<any>) => {
    e.preventDefault()
    e.stopPropagation()

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      share()
    }
  }, [])

  const loading = accountState.loading

  const [ff] = useFeatureFlagContext()

  if (ff.flags[FeatureFlags.Maintenance]) {
    return <MaintenancePage />
  }

  if (!loading && !place) {
    return (
      <Container style={{ paddingTop: "75px" }}>
        <ItemLayout full>
          <NotFound />
        </ItemLayout>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <title>{place?.title || l("social.place.title") || ""}</title>
        <meta
          name="description"
          content={place?.description || l("social.place.description") || ""}
        />

        <meta
          property="og:title"
          content={place?.title || l("social.place.title") || ""}
        />
        <meta
          property="og:description"
          content={place?.description || l("social.place.description") || ""}
        />
        <meta
          property="og:image"
          content={place?.image || l("social.place.image") || ""}
        />
        <meta property="og:site" content={l("social.place.site") || ""} />

        <meta
          name="twitter:title"
          content={place?.description || l("social.place.title") || ""}
        />
        <meta
          name="twitter:description"
          content={place?.description || l("social.place.description") || ""}
        />
        <meta
          name="twitter:image"
          content={place?.image || l("social.place.image") || ""}
        />
        <meta
          name="twitter:card"
          content={place ? "summary_large_image" : l("social.place.card") || ""}
        />
        <meta
          name="twitter:creator"
          content={l("social.place.creator") || ""}
        />
        <meta name="twitter:site" content={l("social.place.site") || ""} />
      </Helmet>
      <Navigation />
      <Container style={{ paddingTop: "75px" }}>
        <ItemLayout>
          <PlaceDescription
            place={place}
            onClickLike={async () =>
              handleLike(place.id, place.user_like ? null : true)
            }
            onClickDislike={async () =>
              handleDislike(place.id, place.user_dislike ? null : false)
            }
            onClickShare={async (e) => handleShare(e)}
            onClickFavorite={async () => handleFavorite(place.id, place)}
            loading={loading || handlingShare}
            loadingFavorite={handlingFavorite.has(place.id)}
            loadingLike={handlingLike.has(place.id)}
            loadingDislike={handlingDislike.has(place.id)}
          />
          <PlaceDetails place={place} loading={loading} />
        </ItemLayout>
      </Container>
    </>
  )
}
