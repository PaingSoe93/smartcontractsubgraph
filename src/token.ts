import {
  Transfer as TransferEvent,
  Token as TokenContract,
} from "../generated/Token/Token";

import { Token, User } from "../generated/schema";

import { ipfs, json } from "@graphprotocol/graph-ts";

const ipfshash = "QmaXzZhcYnsisuue5WRdQDH6FDvqkLQX1NckLqBYeYYEfm";

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId.toString();
  let token = Token.load(tokenId);
  if (token == null) {
    token = new Token(tokenId);
    token.tokenID = event.params.tokenId;
    token.tokenURI = "/" + tokenId + ".json";
    let metadata = ipfs.cat(ipfshash + token.tokenURI);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        const image = value.get("image");
        const name = value.get("name");
        const description = value.get("description");
        const externalURL = value.get("external_url");
        if (name && description && image && externalURL) {
          token.name = name.toString();
          token.description = description.toString();
          token.image = image.toString();
          token.externalURL = externalURL.toString();
        }
        const coven = value.get("coven");
        if (coven) {
          let covenData = coven.toObject();
          const type = covenData.get("type");
          if (type) {
            token.type = type.toString();
          }
          const birthChart = covenData.get("birth_chart");
          if (birthChart) {
            const birthChartData = birthChart.toObject();
            const sun = birthChartData.get("sun");
            const moon = birthChartData.get("moon");
            const rising = birthChartData.get("rising");
            if (sun && moon && rising) {
              token.sun = sun.toString();
              token.moon = moon.toString();
              token.rising = rising.toString();
            }
          }
        }
      }
      token.updatedAtTimestamp = event.block.timestamp;
      token.owner = event.params.to.toHexString();
      token.save();

      let user = User.load(token.owner);
      if (user == null) {
        user = new User(token.owner);
        user.save();
      }
    } else {
      token.owner = event.params.to.toHexString();
      token.save();
    }

    let user = User.load(event.params.to.toHexString());
    if (user == null) {
      user = new User(event.params.to.toHexString());
      user.id = event.params.to.toHexString();
      user.save();
    }
  }
}
