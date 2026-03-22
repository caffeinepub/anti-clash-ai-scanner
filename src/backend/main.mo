import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Option "mo:core/Option";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module HexColor {
    public func compare(color1 : HexColor, color2 : HexColor) : Order.Order {
      switch (Text.compare(color1.hex, color2.hex)) {
        case (#equal) { Text.compare(color1.name, color2.name) };
        case (other) { other };
      };
    };
  };

  module FavoriteColor {
    public func compare(color1 : FavoriteColor, color2 : FavoriteColor) : Order.Order {
      switch (Int.compare(color1.timestamp, color2.timestamp)) {
        case (#equal) { HexColor.compare(color1.color, color2.color) };
        case (other) { other };
      };
    };
  };

  type HexColor = {
    hex : Text;
    name : Text;
  };

  type HarmonyPalette = {
    complementary : [HexColor];
    analogous : [HexColor];
    triadic : [HexColor];
    styleTip : Text;
  };

  type FavoriteColor = {
    id : Text;
    color : HexColor;
    timestamp : Time.Time;
    harmonyPalette : Text;
  };

  type UserProfile = {
    displayName : Text;
    email : Text;
    age : Nat;
    gender : Text;
    emailVerified : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userFavorites = Map.empty<Principal, Set.Set<FavoriteColor>>();

  func generateColorId(user : Principal, hexColor : Text, name : Text) : Text {
    let principalString = user.toBlob().toArray().toText();
    let cleanedHex = hexColor.trim(#char '#');
    let combined = principalString # cleanedHex # name;
    let first6 = if (combined.size() <= 6) { combined } else {
      let chars = (combined # "").toArray();
      let subArray = chars.sliceToArray(0, 6 : Nat);
      subArray.toText();
    };
    first6;
  };

  public shared ({ caller }) func saveUserProfile(profile : UserProfile) : async () {
    validateProfile(profile);
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    validateProfile(profile);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func deleteUserAccount() : async () {
    userProfiles.remove(caller);
    userFavorites.remove(caller);
  };

  public shared ({ caller }) func verifyEmail() : async () {
    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) { p };
    };
    userProfiles.add(caller, { profile with emailVerified = true });
  };

  func validateProfile(profile : UserProfile) {
    if (profile.displayName == "" or profile.displayName.size() > 50) {
      Runtime.trap("Display name must be between 1-50 characters");
    };
    if (not profile.email.contains(#char '@')) {
      Runtime.trap("Invalid email address");
    };
    if (profile.age < 13 or profile.age > 120) {
      Runtime.trap("Age must be between 13 and 120");
    };
    if (profile.gender != "man" and profile.gender != "woman" and profile.gender != "all") {
      Runtime.trap("Gender must be 'man', 'woman' or 'all'");
    };
  };

  public shared ({ caller }) func addFavoriteColor(hexColor : Text, name : Text, harmonyPalette : Text) : async () {
    if (hexColor == "" or name == "") {
      Runtime.trap("Color data cannot be empty");
    };

    let newColor : FavoriteColor = {
      id = generateColorId(caller, hexColor, name);
      color = { hex = hexColor; name };
      timestamp = Time.now();
      harmonyPalette;
    };

    let favorites = switch (userFavorites.get(caller)) {
      case (null) { Set.empty<FavoriteColor>() };
      case (?existing) { existing };
    };

    if (favorites.any(func(fav) { fav.id == newColor.id })) {
      Runtime.trap("Color already in favorites!");
    };

    favorites.add(newColor);
    userFavorites.add(caller, favorites);
  };

  public query ({ caller }) func getFavorites() : async [FavoriteColor] {
    switch (userFavorites.get(caller)) {
      case (null) { [] };
      case (?favorites) { favorites.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteFavoriteById(id : Text) : async Bool {
    let favorites = switch (userFavorites.get(caller)) {
      case (null) { return false };
      case (?existing) { existing };
    };

    if (favorites.isEmpty()) {
      return false;
    };

    let filteredFavorites = favorites.filter(func(fav) { fav.id != id });
    if (filteredFavorites.isEmpty()) {
      userFavorites.remove(caller);
    } else {
      userFavorites.add(caller, filteredFavorites);
    };
    true;
  };

  public func getHarmonyAdvice(_hexColor : Text) : async HarmonyPalette {
    {
      complementary = [
        { hex = "#ff0000"; name = "Red" },
      ];
      analogous = [
        { hex = "#00ff00"; name = "Green" },
        { hex = "#0000ff"; name = "Blue" },
      ];
      triadic = [
        { hex = "#ffff00"; name = "Yellow" },
        { hex = "#ff00ff"; name = "Magenta" },
      ];
      styleTip = "No tip available.";
    };
  };

  public query ({ caller }) func countUserFavorites() : async Nat {
    switch (userFavorites.get(caller)) {
      case (null) { 0 };
      case (?favorites) { favorites.size() };
    };
  };
};
