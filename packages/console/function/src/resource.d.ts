import "sst"

declare module "sst" {
  export interface Resource {
    LakeIngest: {
      secret: string
      type: "sst.sst.Linkable"
      url: string
    }
    InferenceEventLake: {
      catalog: string
      database: string
      region: string
      table: string
      tableBucket: string
      type: "sst.sst.Linkable"
      workgroup: string
    }
  }
}
