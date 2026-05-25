import "sst"

declare module "sst" {
  export interface Resource {
    LakeIngestConfig: {
      secret: string
      streamName: string
      type: "sst.sst.Linkable"
    }
  }
}
