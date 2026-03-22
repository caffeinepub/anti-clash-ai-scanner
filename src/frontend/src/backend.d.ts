import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HarmonyPalette {
    triadic: Array<HexColor>;
    styleTip: string;
    analogous: Array<HexColor>;
    complementary: Array<HexColor>;
}
export type Time = bigint;
export interface FavoriteColor {
    id: string;
    color: HexColor;
    timestamp: Time;
    harmonyPalette: string;
}
export interface UserProfile {
    age: bigint;
    emailVerified: boolean;
    displayName: string;
    email: string;
    gender: string;
}
export interface HexColor {
    hex: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFavoriteColor(hexColor: string, name: string, harmonyPalette: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    countUserFavorites(): Promise<bigint>;
    deleteFavoriteById(id: string): Promise<boolean>;
    deleteUserAccount(): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFavorites(): Promise<Array<FavoriteColor>>;
    getHarmonyAdvice(_hexColor: string): Promise<HarmonyPalette>;
    getUserProfile(): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserProfile(profile: UserProfile): Promise<void>;
    verifyEmail(): Promise<void>;
}
