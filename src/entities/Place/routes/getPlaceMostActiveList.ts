import { withAuthOptional } from "decentraland-gatsby/dist/entities/Auth/routes/withDecentralandAuth"
import Context from "decentraland-gatsby/dist/entities/Route/wkc/context/Context"
import ApiResponse from "decentraland-gatsby/dist/entities/Route/wkc/response/ApiResponse"
import Router from "decentraland-gatsby/dist/entities/Route/wkc/routes/Router"
import { bool, numeric } from "decentraland-gatsby/dist/entities/Schema/utils"
import { sort, unique } from "radash/dist/array"

import { getHotScenes } from "../../../modules/hotScenes"
import PlaceModel from "../model"
import { FindWithAggregatesOptions, PlaceListOrderBy } from "../types"
import { placesWithUserCount } from "../utils"
import { validateGetPlaceListQuery } from "./getPlaceList"

export const getPlaceMostActiveList = Router.memo(
  async (ctx: Context<{}, "url" | "request">) => {
    const query = await validateGetPlaceListQuery({
      positions: ctx.url.searchParams.getAll("positions"),
      offset: ctx.url.searchParams.get("offset"),
      limit: ctx.url.searchParams.get("limit"),
      only_favorites: ctx.url.searchParams.get("only_favorites"),
      only_featured: ctx.url.searchParams.get("only_featured"),
      order_by: PlaceListOrderBy.MOST_ACTIVE,
      order: ctx.url.searchParams.get("order") || "desc",
    })

    const hotScenes = await getHotScenes()

    const hotScenesPositions = hotScenes.map((scene) =>
      scene.baseCoords.join(",")
    )

    const userAuth = await withAuthOptional(ctx)

    if (
      (bool(query.only_favorites) && !userAuth?.address) ||
      numeric(query.offset) > hotScenes.length
    ) {
      return new ApiResponse([], { total: 0 })
    }

    const options: FindWithAggregatesOptions = {
      user: userAuth?.address,
      offset: numeric(query.offset, { min: 0 }),
      limit: numeric(query.limit, { min: 0, max: 100 }),
      only_favorites: !!bool(query.only_favorites),
      only_featured: !!bool(query.only_featured),
      positions: query.positions.length
        ? unique([...hotScenesPositions, ...query.positions])
        : hotScenesPositions,
      order_by: PlaceListOrderBy.MOST_ACTIVE,
      order: query.order,
    }

    const { offset, limit, order, ...extraOptions } = options
    const places = await PlaceModel.findWithAggregates({
      offset: 0,
      limit: 100,
      order,
      ...extraOptions,
    })

    const hotScenePlaces = sort(
      placesWithUserCount(places, hotScenes),
      (place) => place.user_count,
      !order || order === "desc"
    )

    const total = hotScenePlaces.length

    const from = numeric(offset || 0, { min: 0 })
    const to = numeric(from + (limit || 100), { min: 0, max: 100 })

    return new ApiResponse(hotScenePlaces.slice(from, to), { total })
  }
)