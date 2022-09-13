import routes from "decentraland-gatsby/dist/entities/Route/wkc/routes"
import env from "decentraland-gatsby/dist/utils/env"

import { getPlace } from "./getPlace"

export const DECENTRALAND_URL = env("DECENTRALAND_URL", "")

export default routes((router) => {
  router.get("/place/:place_id", getPlace)
})