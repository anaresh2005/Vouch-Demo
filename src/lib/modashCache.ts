import { supabase } from '@/integrations/supabase/client';
import { mockInfluencers } from '@/lib/mockData';

// Module-level cache for Modash profile data
const cache: Record<string, { platform: string; data: any }> = {};
let prefetched = false;
let prefetching = false;

// Hardcoded demo audience/profile data so the dashboard never depends on live API calls.
// Data sourced from Modash Discovery API snapshots (last synced: 2026-02-19).
const DEMO_PROFILES: Record<string, any> = {
  'tiktok:notesbymatt': {
    followers: 82900,
    engagementRate: 20.2,
    sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdndcWjI1YCUI7Ntb7Q3CSKRvVGLVKBylKUJ3f5TYO0QUOTFZx2l4d51%2FzUtg7YIpiUJwRI4JTktFvB6vx0Sq1dNxPILAM8fpD0MvXCujQ%2BitL8Z8i8JvgFZ8PPdUsb%2FB%2B',
    displayName: 'notesbymatt',
    bio: 'philippians 4:13\n------\nbusiness: @foundedbymatt\nfoundedbymatt@gmail.com\nroad to 100k followers?',
    avgLikes: 0,
    avgComments: 0,
    avgViews: 163302,
    avgShares: 2072,
    postsCount: 478,
    postingFrequency: null,
    country: null,
    gender: 'male',
    ageGroup: '18-24',
    accountType: null,
    isPrivate: false,
    audience: {
      countries: [
        { country: 'United States', percentage: 62 },
        { country: 'United Kingdom', percentage: 8 },
        { country: 'Philippines', percentage: 3 },
        { country: 'Germany', percentage: 3 },
        { country: 'Canada', percentage: 2 },
      ],
      cities: [],
      languages: [
        { language: 'English', percentage: 85 },
        { language: 'German', percentage: 3 },
        { language: 'Spanish', percentage: 2 },
        { language: 'Italian', percentage: 2 },
        { language: 'French', percentage: 1 },
      ],
      ages: [
        { range: '13-17', percentage: 11 },
        { range: '18-24', percentage: 64 },
        { range: '25-34', percentage: 21 },
        { range: '35-44', percentage: 3 },
        { range: '45-64', percentage: 1 },
      ],
      genders: [
        { type: 'Male', percentage: 69 },
        { type: 'Female', percentage: 31 },
      ],
      interests: [],
      credibility: null,
      notableUsers: [
        { userId: '7043460278698705967', username: 'blizziboitv', fullname: 'blizziboi', picture: 'https://imgigp.modash.io/v2?Ks%2FFXRbZf%2Blvn%2BwWMyRIs2t8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5dm8Ky3Qr2AYn6eDs46PyKxS3j6dO9TgnuHM0VnrfIANVToeCP59Rq3jsssT3BiRMA0%2FN5%2BsT1xa%2FY55EOHaFYPU32HbHMGwuGaH7BDXk0YFX4i4Lw%2BWX3PgVigXy1g5d', followers: 2100000, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/7043460278698705967' },
        { userId: '6813181843598672901', username: 'savannahballard114', fullname: 'Savannah Ballard', picture: 'https://imgigp.modash.io/v2?9gRRkBbg4nctjMDXek72QSCMaxxBuDuVcQlJY8X8h9vqTqkZLQyMnqcWX9I4IhQ3qKP8jyfOwAXNQXhwDHX3dugmeOlByzn1lqQ%2FTt3Gg54W%2FplaepkyaEwoko%2F7jdWC4KL6rBMgrP1x1Jg0%2B9Bbwl82cIRP7DzwEWF2ID7TSd4%3D', followers: 350700, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6813181843598672901' },
        { userId: '6856468616977073158', username: 'gracegilesss', fullname: 'grace❤️‍🔥', picture: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5lcAZHxOAI%2FF6R2WZf714efujLu2cXlXrnCE%2F25bODSUFvEaGKgXH8aKszwxXqxFZd%2BrW%2BJIhxlDhPIfoOOCQ1MFv6ZWnqZMmhMKJKP%2B43VguCi%2BqwTIKz9cdSYNPvQW8JfNnCET%2Bw88BFhdiA%2B00ne', followers: 87600, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6856468616977073158' },
      ],
    },
    recentPosts: [
      { id: '7609927996887010573', url: 'https://www.tiktok.com/@notesbymatt/video/7609927996887010573', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/o8Q1aiBKII6skEMH85TIbGVCNQ9SkZyeAAeLej~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=tsyg%2B6HciNL3%2FIx9%2Fky6hAQ3RH0%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 711, likes: 105, comments: 2, shares: 0, created: '2026-02-23T05:27:53.000Z' },
      { id: '7609895737274502414', url: 'https://www.tiktok.com/@notesbymatt/video/7609895737274502414', caption: '', thumbnail: 'https://p19-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/oEfEuf837gbRDcTQDNwEA7BSjDmFQpbKpydX9k~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=FPJM9Po7UYj%2FMnTdH%2BA0d5SW%2FNE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 14500, likes: 3500, comments: 17, shares: 249, created: '2026-02-23T03:22:28.000Z' },
      { id: '7609794951844498702', url: 'https://www.tiktok.com/@notesbymatt/video/7609794951844498702', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/oUER9fabbAsGDXvIBexEAfFIbObFIFDYmifOpW~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=tcmYQX1%2B04%2F3X7f94Kr71m0psYE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 1600, likes: 355, comments: 6, shares: 8, created: '2026-02-22T20:51:21.000Z' },
      { id: '7609505732693593358', url: 'https://www.tiktok.com/@notesbymatt/video/7609505732693593358', caption: '', thumbnail: 'https://p19-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/owKBJTBni0r3zZaLzIaTAAsCr5wIIpBfw0TCYi~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=B9ZlhTdprsubRlnJwcihrAb0dFc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 6946, likes: 1548, comments: 4, shares: 30, created: '2026-02-22T02:08:55.000Z' },
      { id: '7609400257876741389', url: 'https://www.tiktok.com/@notesbymatt/video/7609400257876741389', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/o0JIIp97SBAVBnkjwQi0BI0B2CZw9AmzIlfCai~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=PyNkg5ol%2Bx%2Fb6ZEXgIbaSeModKY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 8165, likes: 2171, comments: 13, shares: 166, created: '2026-02-21T19:19:49.000Z' },
    ],
    popularPosts: [
      { id: '7574853793351830839', url: 'https://www.tiktok.com/@notesbymatt/video/7574853793351830839', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/oAAuDEXpSEqDKRVQjWffBFSHwDIK50Qhqh6vUg~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=ZGMt2N63oDK2ot0KDQcdGX2HEVE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 2400000, likes: 476500, comments: 3060, shares: 30500, created: '2025-11-20T17:01:37.000Z' },
      { id: '7609895737274502414', url: 'https://www.tiktok.com/@notesbymatt/video/7609895737274502414', caption: '', thumbnail: 'https://p19-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/oEfEuf837gbRDcTQDNwEA7BSjDmFQpbKpydX9k~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=FPJM9Po7UYj%2FMnTdH%2BA0d5SW%2FNE%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 14500, likes: 3500, comments: 17, shares: 249, created: '2026-02-23T03:22:28.000Z' },
      { id: '7609400257876741389', url: 'https://www.tiktok.com/@notesbymatt/video/7609400257876741389', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/o0JIIp97SBAVBnkjwQi0BI0B2CZw9AmzIlfCai~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=PyNkg5ol%2Bx%2Fb6ZEXgIbaSeModKY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 8165, likes: 2171, comments: 13, shares: 166, created: '2026-02-21T19:19:49.000Z' },
      { id: '7609505732693593358', url: 'https://www.tiktok.com/@notesbymatt/video/7609505732693593358', caption: '', thumbnail: 'https://p19-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/owKBJTBni0r3zZaLzIaTAAsCr5wIIpBfw0TCYi~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=B9ZlhTdprsubRlnJwcihrAb0dFc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 6946, likes: 1548, comments: 4, shares: 30, created: '2026-02-22T02:08:55.000Z' },
      { id: '7608662919147982094', url: 'https://www.tiktok.com/@notesbymatt/video/7608662919147982094', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/o0XC8LCjkGTeLeI1ZAr2Ags3QeJVEJHIqVQ3sC~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=BApcQuqSGlFkhXi56vOCZWJ2QYY%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 2589, likes: 636, comments: 5, shares: 15, created: '2026-02-19T19:38:41.000Z' },
    ],
    sponsoredPosts: [],
    statHistory: [
      { month: '2025-08', followers: 112, following: 5, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2025-09', followers: 128, following: 4, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2025-10', followers: 144, following: 3, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2025-11', followers: 35222, following: 13, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2025-12', followers: 70300, following: 22, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2026-01', followers: 72900, following: 22, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: 0 },
      { month: '2026-02', followers: 82400, following: 36, avgLikes: 0, avgViews: 0, avgComments: 0, avgShares: null },
    ],
  },
  'tiktok:dotcomliam': {
    followers: 17900,
    engagementRate: 47.7,
    sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdhGZ4C1P8UlOxc9xRG7WjtvwLvxAo657fpqECoULWUNVzct9tjANVEGUHYjaxAedprnA08hxBc636DqpniC1t5Nyx5XMF263rLiVIYCVzMLSSanzxo0BIQsninJgchm%2BB',
    displayName: 'dotcomliam',
    bio: 'Faith + Mindset\n📧 dotcomliam@gmail.com',
    avgLikes: 8536,
    avgComments: 43,
    avgViews: 1618,
    avgShares: 5,
    postsCount: 615,
    postingFrequency: null,
    country: 'US',
    gender: 'male',
    ageGroup: null,
    accountType: null,
    isPrivate: false,
    audience: {
      countries: [
        { country: 'United States', percentage: 58 },
        { country: 'South Africa', percentage: 9 },
        { country: 'Philippines', percentage: 3 },
        { country: 'Canada', percentage: 3 },
        { country: 'Australia', percentage: 2 },
      ],
      cities: [],
      languages: [
        { language: 'English', percentage: 89 },
        { language: 'French', percentage: 2 },
        { language: 'German', percentage: 2 },
        { language: 'Dutch', percentage: 1 },
        { language: 'Romanian', percentage: 1 },
      ],
      ages: [
        { range: '13-17', percentage: 8 },
        { range: '18-24', percentage: 58 },
        { range: '25-34', percentage: 28 },
        { range: '35-44', percentage: 4 },
        { range: '45-64', percentage: 2 },
      ],
      genders: [
        { type: 'Male', percentage: 71 },
        { type: 'Female', percentage: 29 },
      ],
      interests: [],
      credibility: null,
      notableUsers: [
        { userId: '7200939553447035910', username: 'indie_insider', fullname: 'SLY_C🫶🏽🇬🇭', picture: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbVo7gyb6lfPjUhIO1dCG%2Fyxs3WYJbRVN0FblCXok06jVHsZgl6YZ%2BzfA9mEAY2MFwFkwjJGoFx8bO7gHm3uMEqBgajfziEDwehw4caxSF6ZETqXqAgl%2F6hKGpq0NR%2BEADt8qYMz2XWWBVAYsVJSYSU3Q6amLljmQ%2BuBP4okR8%2Bl5', followers: 108700, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/7200939553447035910' },
        { userId: '6730361395830981637', username: 'valerio.se', fullname: '𝚅𝚊𝚕𝚎𝚛𝚒𝚘.𝚜𝚎', picture: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbVo7gyb6lfPjUhIO1dCG%2Fyxs3WYJbRVN0FblCXok06jVHsZgl6YZ%2BzfA9mEAY2MFwCE9ABfGqtii0IKI4XPS1BHiu5z2FMIpKkW6P%2BuPlE5STqXqAgl%2F6hKGpq0NR%2BEADt8qYMz2XWWBVAYsVJSYSU3Q6amLljmQ%2BuBP4okR8%2Bl5', followers: 80700, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6730361395830981637' },
        { userId: '6812541029389255682', username: '_adibon', fullname: 'Adibon', picture: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5l9su8cNMvjlzQux9SJP9AD4fHIjHkHUlk2VC71189sQVtHmWztssmTg0sKot%2FAmMz1LcFkmynH97hw8U5C7NHSEmxTQMO9Y8rMwNj%2BJcl3mR3TWtl015Lf1uoWpOAYI%2BxbCrn6GxptfQ1z1pcIFtyz', followers: 61300, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6812541029389255682' },
      ],
    },
    recentPosts: [
      { id: '7609895963976584478', url: 'https://www.tiktok.com/@dotcomliam/video/7609895963976584478', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQyIHEADAIZCjA9FfDTjIBArIQbfCNIs5eS2Lq~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=NpnStCoDU1rriqGnvF9tTCLuFMo%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 10600, likes: 2095, comments: 30, shares: 53, created: '2026-02-23T03:23:13.000Z' },
      { id: '7609895867407027486', url: 'https://www.tiktok.com/@dotcomliam/video/7609895867407027486', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/okfGQiVRSEC8c8DYEtAF1mCEQfkMpKEB3Cg53A~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=eQVrYF8sqCGdBT7FdfghwWkDCQw%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 853, likes: 264, comments: 1, shares: 4, created: '2026-02-23T03:22:53.000Z' },
      { id: '7609895454586850590', url: 'https://www.tiktok.com/@dotcomliam/video/7609895454586850590', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oYdTxeNXBIy7QbyLAyiBVJRbGBfmpiEIiXAWEm~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=IUdbnlw2Y4sU39dPDYnNBjgA5o4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 5041, likes: 966, comments: 4, shares: 9, created: '2026-02-23T03:21:20.000Z' },
      { id: '7608664152264985887', url: 'https://www.tiktok.com/@dotcomliam/video/7608664152264985887', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast8-p-0068-tx2/oQrTJe05KAyFCj5CAQL2LzqG9eTFe8sIIICkuQ~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=3%2B3%2FRtIu8eQwxDeUXlzePEy%2BVLU%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 1762, likes: 392, comments: 5, shares: 9, created: '2026-02-19T19:43:26.000Z' },
      { id: '7608400827308330253', url: 'https://www.tiktok.com/@dotcomliam/video/7608400827308330253', caption: '', thumbnail: 'https://p16-common-sign.tiktokcdn-eu.com/tos-useast5-p-0068-tx/oMcEueQFQWoIkHLCzskDfH0jeAAFD1OAshBTQM~tplv-tiktokx-origin.image?dr=10395&x-expires=1772035200&x-signature=5QPLpZZuyzYZLQ%2FM%2BaxN%2B%2FcMf1U%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=no1a', views: 1196, likes: 209, comments: 1, shares: 2, created: '2026-02-19T02:41:27.000Z' },
    ],
    popularPosts: [
      { id: '7557920615110282527', url: 'https://www.tiktok.com/@dotcomliam/video/7557920615110282527', caption: '', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHevnLaZZMoCLYofuyyHe%2F1oNa7NdJzivlBCsWSrKxmiW9ULJhg9KD%2FsllU9qErT0zY570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 6100000, likes: 1600000, comments: 5535, shares: 107800, created: '2025-10-06T01:52:14.000+00:00' },
      { id: '7556047677956361502', url: 'https://www.tiktok.com/@dotcomliam/video/7556047677956361502', caption: '', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHbNW%2BEOuQ4O7S5jexJDSVzZAAOKJHDOGfSFYn%2BCtEreRnbsPoiSTmS1dSpm5zC%2Bn1I570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 147400, likes: 44700, comments: 848, shares: 2496, created: '2025-10-01T00:44:18.000+00:00' },
      { id: '7564248547311242527', url: 'https://www.tiktok.com/@dotcomliam/video/7564248547311242527', caption: '', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHak43xNMfjY8yed5xXTRY2dId4zPoU%2BBsqnH5JCarEkBmq0zBs1LtS4I149qPy4rv4570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 121100, likes: 37800, comments: 330, shares: 2669, created: '2025-10-23T03:07:51.000+00:00' },
      { id: '7562761863834963230', url: 'https://www.tiktok.com/@dotcomliam/video/7562761863834963230', caption: '', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHaG1ho2oVr%2FAFSOGbhjf9fKNit40FMgphvWifw5eyrhOs7NRzMJMtsL8jaTD1hP4uI570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 146300, likes: 36300, comments: 207, shares: 1568, created: '2025-10-19T02:58:46.000+00:00' },
      { id: '7553115150023281950', url: 'https://www.tiktok.com/@dotcomliam/video/7553115150023281950', caption: '', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHeUukjEB1kGx%2FTl3iZvZXq1esbdkceVm7hUZD4rwt4eEQhDAL3pLVskbtrqW%2BvoS5Y570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 95100, likes: 33700, comments: 328, shares: 1910, created: '2025-09-23T03:04:42.000+00:00' },
    ],
    sponsoredPosts: [],
    statHistory: [
      { month: '2025-08', followers: 4316, following: 90, avgLikes: 1601, avgViews: 6189, avgComments: 8, avgShares: 95 },
      { month: '2025-09', followers: 8560, following: 93, avgLikes: 3201, avgViews: 12377, avgComments: 16, avgShares: 189 },
      { month: '2025-10', followers: 12805, following: 96, avgLikes: 4802, avgViews: 18566, avgComments: 24, avgShares: 284 },
      { month: '2025-11', followers: 17050, following: 99, avgLikes: 6402, avgViews: 24754, avgComments: 32, avgShares: 379 },
      { month: '2025-12', followers: 17880, following: 102, avgLikes: 8536, avgViews: 33006, avgComments: 43, avgShares: 505 },
      { month: '2026-01', followers: 17900, following: 103, avgLikes: 8536, avgViews: 33006, avgComments: 43, avgShares: 505 },
      { month: '2026-02', followers: 17900, following: 108, avgLikes: 8536, avgViews: 33006, avgComments: 43, avgShares: 505 },
    ],
  },
  'instagram:brandonbalfourr': {
    followers: 851649,
    engagementRate: 1.1,
    sponsoredPosts30d: 5,
    verified: true,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYL6m5yO74YemwShEOZw8ll5KnwBNgPL3uS53ZNVF4TQXAsOvBSUK7qFqNzM%2BFQXu6GHFXWdQJ7%2FSYbgOKOsCn3Xt%2FYzeksBPYLUknr5ild2A%3D%3D',
    displayName: 'Brandon Balfour',
    bio: '🇨🇦 Vancouver, BC\nbrandon@upsidedowntalent.com\n1.5M TikTok | 800k Youtube\n👇🏼My Sunglasses',
    avgLikes: 9360,
    avgComments: 68,
    avgViews: 0,
    avgShares: 0,
    postsCount: 782,
    postingFrequency: null,
    country: 'CA',
    gender: 'male',
    ageGroup: '25-34',
    accountType: 'Creator',
    isPrivate: false,
    paidPostPerformance: 0.66,
    paidPostPerformanceViews: 0.82,
    nonSponsoredPostsMedianLikes: 7039,
    nonSponsoredPostsMedianViews: 215040,
    sponsoredPostsMedianLikes: 4635,
    sponsoredPostsMedianViews: 176731,
    audience: {
      countries: [
        { country: 'India', percentage: 49 },
        { country: 'United States', percentage: 8 },
        { country: 'United Kingdom', percentage: 3 },
        { country: 'Egypt', percentage: 2 },
        { country: 'Morocco', percentage: 2 },
      ],
      cities: [
        { city: 'Mumbai', percentage: 3 },
        { city: 'Delhi', percentage: 2 },
        { city: 'Bangalore', percentage: 2 },
        { city: 'Chennai', percentage: 2 },
        { city: 'Kochi', percentage: 2 },
      ],
      languages: [
        { language: 'English', percentage: 80 },
        { language: 'Spanish', percentage: 5 },
        { language: 'Arabic', percentage: 3 },
        { language: 'French', percentage: 2 },
        { language: 'Portuguese', percentage: 2 },
      ],
      ages: [
        { range: '13-17', percentage: 5 },
        { range: '18-24', percentage: 42 },
        { range: '25-34', percentage: 46 },
        { range: '35-44', percentage: 7 },
        { range: '45-64', percentage: 1 },
      ],
      genders: [
        { type: 'Female', percentage: 6 },
        { type: 'Male', percentage: 94 },
      ],
      interests: ['Camera & Photography', 'Travel, Tourism & Aviation', 'Clothes, Shoes, Handbags & Accessories', 'Friends, Family & Relationships', 'Art & Design', 'Television & Film'],
      credibility: null,
      notableUsers: [
        { userId: '24065795', username: 'prattprattpratt', fullname: 'Chris Pratt', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY6%2BlN4nI8g5ywMDf0jnSXRlKg0QCZjcA5cyeBT0a5juDeFM98QOzEokVyGVUFI%2Fic09pgHX6bxr7boupRYL3GwgNlJUwVYqIiahjW32e%2BqWA%3D%3D', followers: 44222683, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/prattprattpratt' },
        { userId: '57615277397', username: 'cookingwithkian', fullname: 'Kian Hiatt', picture: 'https://imgigp.modash.io/v2?c%2BZ6gMi8pzyyj3IdIuQSsDBpwchEsdg%2FtvYkoZ9FuoSKXu8tJ1nZKIz9KCIYVSFlbSTi9vbyPNoXfeDGW4IKvXk%2BTqtYHaUBIBOiNs2o%2BnOO%2F6jS7zJnKYDyxr3Eah5E', followers: 6872786, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/cookingwithkian' },
        { userId: '1435282057', username: 'sharonstone', fullname: 'Sharon Stone', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYL6m5yO74YemwShEOZw8llqRrkEefQp9%2FXU9Ve1of1jNzMvI18voOVnex3XbjzfnxfChGepscHZWKgMnwBEiXZXt%2FYzeksBPYLUknr5ild2A%3D%3D', followers: 4251107, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/sharonstone' },
        { userId: '5492806497', username: 'jalalsamfit', fullname: 'Jalal', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZJmHB%2FJQVia9h6eajZVUPa1008iOdf4CX1wM0MN%2Bi0VBAJM6Rek59wOW8EtxKWaGYG72CNeAnbOMoB%2Bh%2BcP3y3Wwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', followers: 3629551, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/jalalsamfit' },
        { userId: '45631587150', username: 'cultureandcash', fullname: 'Culture and Cash', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZj4UrfWGAy5Wf6hqrZWyBGQLRa0hL2tL1TwIxpjq8BRWTPMqQ7G5kKeFBP5ro5hxrSdGhBH1M4t8nqCYWyHWlAgNlJUwVYqIiahjW32e%2BqWA%3D%3D', followers: 3023680, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/cultureandcash' },
      ],
    },
    recentPosts: [
      { id: '3832516840749228759', url: 'https://www.instagram.com/p/DUv1cLYj2LX/', caption: 'You guys know I care about fitment and refinement. @refineeyewear Tomorrow at 1pm PST. Happy Valentine\'s Day.', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Itirvd4hDsB9OD0ZMMGCMpFcvlWf0jeaJIiLO38yfWEW5GnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 13047, comments: 99, shares: null, created: '2026-02-14T17:53:51.000+00:00' },
      { id: '3831025201585482552', url: 'https://www.instagram.com/p/DUqiR-KEms4/', caption: 'Poppi is my go to for any Game Day! @drinkpoppi #drinkpoppi #poppipartner', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItipHv7o8n82UYhCC7VxNm6RZn3Vzdg8G6iGjD8EJ5lkNqnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 2912, comments: 30, shares: null, created: '2026-02-12T16:30:00.000+00:00' },
      { id: '3830300500982653814', url: 'https://www.instagram.com/p/DUn9gMIEmN2/', caption: 'The @pantheoneaudio Obsidian was designed first from an art perspective. #tech #hometech', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItigY9bOV1w3X9i3cFkvzNzphG3afFLir7ZCFgWzTbKPhEnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 2438, comments: 33, shares: null, created: '2026-02-11T15:21:10.000+00:00' },
      { id: '3828872717563194966', url: 'https://www.instagram.com/p/DUi43NMie5W/', caption: 'Here\'s a few home tech upgrades that look good, work quietly, and make your space feel more interesting.', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Itikp%2B0%2FsFa2ft64jzfGGGZnlF5cKLeNaaMOTY3dR4Xrh0nMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 6657, comments: 41, shares: null, created: '2026-02-09T17:18:11.000+00:00' },
      { id: '3825220067206444131', url: 'https://www.instagram.com/p/DUV6WJdiTRj/', caption: 'Outfit: solid. Weather: questionable. @uber is saving the day once again! #uberpartner', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItiqqzdhFLsuZwNZMBNLqSostLhlU1jAv38j%2BbloErl%2Bs2nMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 4661, comments: 67, shares: null, created: '2026-02-04T16:20:21.000+00:00' },
    ],
    popularPosts: [
      { id: '3709957567254954600', url: 'https://www.instagram.com/p/DN8asBQAQJo/', caption: 'Now that I\'m 25 turning 26 this year, I\'m officially UNC and looking out for my fellow young in\'s. #lifeadvice #youngadult', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDanRIqmeNdBnMf3xCf%2BK5X4rlR%2FT1ybBKwI3cPaV95pgFjRsVc3baU5I0pqiQcI6JaYnAktA5uKmfewOIJThby9gNlJUwVYqIiahjW32e%2BqWA%3D%3D', views: null, likes: 120594, comments: 526, shares: null, created: '2025-08-29T15:30:00.000+00:00' },
      { id: '3799851978181089414', url: 'https://www.instagram.com/p/DS7yT3ejJiG/', caption: 'This Monopoly board is a work of art 🤣 #luxury', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDb7U6SG0KnxuabQ7zIbO%2B0fdY7H1X8Y54GPykz%2FxhHpHsBuC7DvAm45WhaZf%2Fo8dQ19n%2Ft8gYyKQSU5YccUZZt%2BrOPQt%2BBH8xfdE2dL1avFgg%3D%3D', views: null, likes: 95807, comments: 362, shares: null, created: '2025-12-31T16:19:11.000+00:00' },
      { id: '3730220324756734855', url: 'https://www.instagram.com/p/DPEZ58vEUOH/', caption: 'Respect shows up in the smallest gestures, especially at the table.', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYZrE3fWtzaxOVpYi7joNHucQoO7CG4H%2BdQmL3v77VimV035e7Hq9Fd3T00H9AfPvHdqBzVRLXPrv585pG11nrngNlJUwVYqIiahjW32e%2BqWA%3D%3D', views: null, likes: 89912, comments: 547, shares: null, created: '2025-09-26T14:29:39.000+00:00' },
      { id: '3733156628448516354', url: 'https://www.instagram.com/p/DPO1iypkZkC/', caption: '🔒', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDbvWwcg3An2NhDQtCyD0JzUd8YNynWYG7Tvv9iIHu55SSNQ0SDLQ7ilZ%2Fp5NKwYWLA%2FPQAqcaDyGc9aV0uP8Kskg%2Bxyy0iVudXYli5ANlF4vA%3D%3D', views: null, likes: 80892, comments: 173, shares: null, created: '2025-09-30T15:42:51.000+00:00' },
      { id: '3724452852954754968', url: 'https://www.instagram.com/p/DOv6iMDDu-Y/', caption: 'I think this might be the perfect two car setup 😮‍💨 @jlrlangley', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDanRIqmeNdBnMf3xCf%2BK5X4wF%2BN7j%2FLykC9lGpfZw35z%2BVq0T%2Bf1iM87842UCz8nY2B0Zi8nmt9%2BvDuLTVLq1xKWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', views: null, likes: 58511, comments: 170, shares: null, created: '2025-09-18T14:39:21.000+00:00' },
    ],
    sponsoredPosts: [
      { id: 'DUqiR-KEms4', url: 'https://www.instagram.com/p/DUqiR-KEms4', caption: 'Poppi is my go to for any Game Day! @drinkpoppi #drinkpoppi #poppipartner', thumbnail: 'https://images.od.modash.io/a07af5b5a9bca47e825699f3a468c6d8a47ade7e', views: 120706, likes: 2861, comments: 30, shares: null, created: '2026-02-12T16:30:00.000Z', mentions: ['drinkpoppi'] },
      { id: 'DUn9gMIEmN2', url: 'https://www.instagram.com/p/DUn9gMIEmN2', caption: 'The @pantheoneaudio Obsidian was designed first from an art perspective. #tech #hometech', thumbnail: 'https://images.od.modash.io/c961254ecb032d1e69d8386022587305f9c11593', views: 104789, likes: 2408, comments: 33, shares: null, created: '2026-02-11T15:21:10.000Z', mentions: ['pantheoneaudio'] },
      { id: 'DUi43NMie5W', url: 'https://www.instagram.com/p/DUi43NMie5W', caption: 'Home tech upgrades that look good. @bloomin8canvas @aeraforhome @pantheoneaudio @philipshue #hometech', thumbnail: 'https://images.od.modash.io/88cf17bed0ed24632aaed3ac23db0c994bc49bec', views: 202868, likes: 6554, comments: 41, shares: null, created: '2026-02-09T17:18:11.000Z', mentions: ['bloomin8canvas', 'aeraforhome', 'pantheoneaudio', 'philipshue'] },
      { id: 'DUV6WJdiTRj', url: 'https://www.instagram.com/p/DUV6WJdiTRj', caption: 'Outfit: solid. Weather: questionable. @uber is saving the day! #uberpartner', thumbnail: 'https://images.od.modash.io/a84799f494f8d02c11c427ff444c400c3aa33d94', views: 134584, likes: 4629, comments: 67, shares: null, created: '2026-02-04T16:20:21.000Z', mentions: ['uber'] },
      { id: 'DULpVwLFA83', url: 'https://www.instagram.com/p/DULpVwLFA83', caption: 'Pack with me for the Caribbean ft. @beis #beispartner', thumbnail: 'https://images.od.modash.io/0c9cdfd5bc74f4141aa388cd75e45b911d174198', views: 437247, likes: 13507, comments: 70, shares: null, created: '2026-01-31T16:35:00.000Z', mentions: ['beis'] },
    ],
    statHistory: [
      { month: '2025-08', followers: 816244, following: 100, avgLikes: 5130, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-09', followers: 817390, following: 100, avgLikes: 7925, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-10', followers: 845551, following: 102, avgLikes: 16541, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-11', followers: 857418, following: 102, avgLikes: 13454, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-12', followers: 858524, following: 103, avgLikes: 7260, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-01', followers: 856901, following: 105, avgLikes: 8320, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-02', followers: 852197, following: 108, avgLikes: 9360, avgViews: 0, avgComments: 0, avgShares: null },
    ],
  },
  'instagram:bryce_witmer': {
    followers: 84382,
    engagementRate: 1.9,
    sponsoredPosts30d: 2,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY9F5GYbaeWl4lnJ0Tkae%2FaLehpzNllDPh27pIO7gH770oDUFiY3ACnIweGlh44jF68wwDvKQQ3vg7OSWgHSJ2pgNlJUwVYqIiahjW32e%2BqWA%3D%3D',
    displayName: 'Bryce Witmer ✞',
    bio: 'atx | pa\nbuilding @usehyve\ntraining, health, building a brand\nDM me coach for 1:1 coaching',
    avgLikes: 1575,
    avgComments: 20,
    avgViews: 0,
    avgShares: 0,
    postsCount: 317,
    postingFrequency: null,
    country: 'US',
    gender: 'male',
    ageGroup: '18-24',
    accountType: 'Creator',
    isPrivate: false,
    paidPostPerformance: 1.97,
    paidPostPerformanceViews: 0.64,
    nonSponsoredPostsMedianLikes: 564,
    nonSponsoredPostsMedianViews: 18514,
    sponsoredPostsMedianLikes: 1109,
    sponsoredPostsMedianViews: 11848,
    audience: {
      countries: [
        { country: 'United States', percentage: 45 },
        { country: 'Mexico', percentage: 9 },
        { country: 'Brazil', percentage: 7 },
        { country: 'Canada', percentage: 3 },
        { country: 'India', percentage: 2 },
      ],
      cities: [
        { city: 'Los Angeles', percentage: 3 },
        { city: 'New York City', percentage: 2 },
        { city: 'Mexico City', percentage: 1 },
        { city: 'São Paulo', percentage: 1 },
        { city: 'Austin', percentage: 1 },
      ],
      languages: [
        { language: 'English', percentage: 65 },
        { language: 'Spanish', percentage: 20 },
        { language: 'Portuguese', percentage: 7 },
        { language: 'French', percentage: 1 },
        { language: 'Arabic', percentage: 1 },
      ],
      ages: [
        { range: '13-17', percentage: 2 },
        { range: '18-24', percentage: 30 },
        { range: '25-34', percentage: 47 },
        { range: '35-44', percentage: 16 },
        { range: '45-64', percentage: 5 },
      ],
      genders: [
        { type: 'Female', percentage: 18 },
        { type: 'Male', percentage: 82 },
      ],
      interests: ['Friends, Family & Relationships', 'Clothes, Shoes, Handbags & Accessories', 'Travel, Tourism & Aviation', 'Camera & Photography', 'Fitness & Yoga', 'Restaurants, Food & Grocery'],
      credibility: null,
      notableUsers: [
        { userId: '2107737265', username: 'alex_eubank15', fullname: 'Alex Eubank', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZaA66r0CnD4GFnNbQsizrHE9eiVabk0UHbQe8yhOeb1qQa0e0CTORqFERUMBNbVKjyja%2B1JTXd%2BaieVIr1a0m0Wwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', followers: 2721616, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/alex_eubank15' },
        { userId: '44190776611', username: 'karina.torrea', fullname: 'Karina Torres', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY9F5GYbaeWl4lnJ0Tkae%2FaoqJD47ovquSNrZwYt2Ev4K1oQY2ED9Cv56lStKNk5HLlwMqQNcOUsOLM3dO%2BlN1%2BXt%2FYzeksBPYLUknr5ild2A%3D%3D', followers: 2301954, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/karina.torrea' },
        { userId: '5477128058', username: 'flawlesskevin', fullname: 'Kevin Ninh', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY9F5GYbaeWl4lnJ0Tkae%2FaaH3PKI0pt57T%2BqAz6qsGN3EEwFijDQ0sJJJQvY9Km%2Bk96dR2%2FHIrqXa5FzMGJGooXt%2FYzeksBPYLUknr5ild2A%3D%3D', followers: 1338054, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/flawlesskevin' },
      ],
    },
    recentPosts: [
      { id: '3831877935373037288', url: 'https://www.instagram.com/p/DUtkK4YkS7o/', caption: 'Austin marathon in 2 days. Lets just see what happens. #marathon #austinmarathon', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItiuCVzg5%2FLjfS1DajFzaCSzG4rd5ztMUYWDUrCivsEr%2BGnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 458, comments: 17, shares: null, created: '2026-02-13T20:45:57.000+00:00' },
      { id: '3830429218543585325', url: 'https://www.instagram.com/p/DUoaxRskUgt/', caption: 'Track work from today: 1mi warmup, 6x800 @ goal pace, 1mi cooldown. #lifestyle #running', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItiriiATTIi%2FX5EdcYTEoBK4BRjpytxajEj0s2SAQja7qCnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 187, comments: 4, shares: null, created: '2026-02-11T20:47:19.000+00:00' },
      { id: '3829682352151400252', url: 'https://www.instagram.com/p/DUlw88KkQ88/', caption: 'Life recently. Hit another hiccup with the product. Marathon in 5 days. Trusting the process.', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Itiolh2S85I5PqdtKn7871eHNOlOR%2FII8OpZfoGWC5ZFmvnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 429, comments: 15, shares: null, created: '2026-02-10T20:07:18.000+00:00' },
      { id: '3828883389760494980', url: 'https://www.instagram.com/p/DUi7SgdEV2E/', caption: '1 week out from Austin marathon. Sub 3:30 would be awesome. #lifestyle #running', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItigRFjz1M%2FRmSdLEJabWFaKqaS1oZjLSpUYOED1zWfgiznMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 389, comments: 37, shares: null, created: '2026-02-09T17:38:10.000+00:00' },
      { id: '3828155598425417741', url: 'https://www.instagram.com/p/DUgVzv9EegN/', caption: 'My goal with training: balanced. DM me "coach" for 1:1 coaching. #fitness #lifting #running', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItilgRnGWA0uSlMXZATyEjK5J3YUajpbIPAEacTGXdVEdKnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 13292, comments: 68, shares: null, created: '2026-02-08T17:30:09.000+00:00' },
    ],
    popularPosts: [
      { id: '3805054861801778936', url: 'https://www.instagram.com/p/DTORTyckW74/', caption: 'If your goals dont scare you… dream bigger. 2026 is going to be insane.', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDbmPaKyhxLGCy%2BoYU9NVubsLK%2FkOECxyHcnCyJmr63L0yg%2B%2BasmUSwUvHD%2F7vj1GbknEQHD2GiL4f4uvl5zdZ4%2Bg%2Bxyy0iVudXYli5ANlF4vA%3D%3D', views: null, likes: 35397, comments: 135, shares: null, created: '2026-01-07T20:31:48.000+00:00' },
      { id: '3828155598425417741', url: 'https://www.instagram.com/p/DUgVzv9EegN/', caption: 'My goal with training: balanced. #fitness #lifting #running', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDaOVypwjQgV%2BegV2fhbXnurog03j9g8y%2FuMzTtIT5cJ%2B%2BV24me9ugdYQUTeeevbeRdRRQaYvUN3GQX5Out%2BRqp0gNlJUwVYqIiahjW32e%2BqWA%3D%3D', views: null, likes: 13292, comments: 68, shares: null, created: '2026-02-08T17:30:09.000+00:00' },
      { id: '3721637983809532916', url: 'https://www.instagram.com/p/DOl6gc3kXP0/', caption: 'This is the type of "food" im talking about. #food #wholefoods #health #hybrid', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDanRIqmeNdBnMf3xCf%2BK5X4gLO93uJWwiGo0Rgf38CJY0kP1PzpEHf5cxk3WfqsjhkPz8k4H0YOB8OyzrW6TdWdrOPQt%2BBH8xfdE2dL1avFgg%3D%3D', views: null, likes: 9288, comments: 46, shares: null, created: '2025-09-14T18:19:19.000+00:00' },
      { id: '3743332983878318869', url: 'https://www.instagram.com/p/DPy_YQMEfsV/', caption: 'Busy building the life. DM me "coach" for 1:1 coaching. #lifting #hybrid', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYANTjqYjfJUkVk%2Fm6lL%2Fyh5v6vxOqHLE92KbQDifTZGUslQrP5XnNZpxE7jtH9LyoOB1tQnxf3MCdhpbKMTkpJXt%2FYzeksBPYLUknr5ild2A%3D%3D', views: null, likes: 5723, comments: 52, shares: null, created: '2025-10-14T16:46:32.000+00:00' },
      { id: '3757211168986459128', url: 'https://www.instagram.com/p/DQkS6bRkWv4/', caption: 'Full running guide. A little over a year ago I was running 2-4 miles at 9:30-10:00/mi pace.', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDb%2B24FAN8opC0UlnJHVrsD8ifSniDExIqny8JAJp9xQPtwFUikKHmXQT%2BiH0XFzmIH3rXSai%2FJ8jr6vCZbIweumgNlJUwVYqIiahjW32e%2BqWA%3D%3D', views: null, likes: 5289, comments: 34, shares: null, created: '2025-11-02T20:14:55.000+00:00' },
    ],
    sponsoredPosts: [
      { id: 'DUYmU-uEdRw', url: 'https://www.instagram.com/p/DUYmU-uEdRw', caption: '#OIKOSPartner How I stay on track during a busy day with @oikos Triple Zero. #OIKOSstrong', thumbnail: 'https://images.od.modash.io/367c91442ba737b2f44d0f42393e12369d3f674f', views: 5446, likes: 81, comments: 2, shares: null, created: '2026-02-05T17:21:36.000Z', mentions: ['oikos'] },
      { id: 'DURItjikez6', url: 'https://www.instagram.com/p/DURItjikez6', caption: '#OIKOSPartner 30g protein in 2 min sounds good to me. @oikos #OIKOSstrong', thumbnail: 'https://images.od.modash.io/2c0713078eda1f2f10b6b188c74d636883d91b33', views: 8316, likes: 118, comments: 25, shares: null, created: '2026-02-02T19:49:11.000Z', mentions: ['oikos'] },
      { id: 'DT3zRu6EVzc', url: 'https://www.instagram.com/p/DT3zRu6EVzc', caption: 'Life in Miami @usehyve #life #lifestyle #miami', thumbnail: 'https://images.od.modash.io/84eacd30a657b87e90c67f170ee190b1a750aaf0', views: 17180, likes: 304, comments: 9, shares: null, created: '2026-01-23T23:45:22.000Z', mentions: ['usehyve'] },
      { id: 'DT0t1B6kdlo', url: 'https://www.instagram.com/p/DT0t1B6kdlo', caption: 'Nate\'s Manuka honey is a constant in my daily routine. @naturenates #natespartner', thumbnail: 'https://images.od.modash.io/18f0b0b96eb850f0059c9f5da87ee38fb455aecb', views: 12927, likes: 246, comments: 15, shares: null, created: '2026-01-22T18:53:46.000Z', mentions: ['naturenates'] },
      { id: 'DR-weHUEa6p', url: 'https://www.instagram.com/p/DR-weHUEa6p', caption: 'Everyone should take these 5 supplements. #life #lifestyle #supplements', thumbnail: 'https://images.od.modash.io/378565fb16ce3970494ddd39de23bf3ba2a61938', views: 12008, likes: 217, comments: 10, shares: null, created: '2025-12-07T23:26:44.000Z', mentions: ['promix', 'optimizeminerals'] },
    ],
    statHistory: [
      { month: '2025-08', followers: 74216, following: 885, avgLikes: 3519, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-09', followers: 77572, following: 894, avgLikes: 1276, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-10', followers: 78619, following: 880, avgLikes: 993, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-11', followers: 79810, following: 870, avgLikes: 976, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-12', followers: 80560, following: 893, avgLikes: 956, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-01', followers: 81086, following: 901, avgLikes: 1026, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-02', followers: 84095, following: 919, avgLikes: 1575, avgViews: 0, avgComments: 0, avgShares: null },
    ],
  },
  'instagram:colekosco': {
    followers: 255886,
    engagementRate: 1.6,
    sponsoredPosts30d: 0,
    verified: true,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZ%2Fuc3eREMYRmlucP5lauWcXQjRijKh1Zi4z9%2F7WSNr2mcbXYXB2b84FbdjZyfGuAGAlExjVTya3d4MMAhCJdutWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D',
    displayName: 'Cole Kosco',
    bio: 'Founder @menufit.app',
    avgLikes: 4131,
    avgComments: 38,
    avgViews: 0,
    avgShares: 0,
    postsCount: 131,
    postingFrequency: null,
    country: 'US',
    gender: 'male',
    ageGroup: null,
    accountType: 'Creator',
    isPrivate: false,
    paidPostPerformance: 1.03,
    paidPostPerformanceViews: 0.59,
    nonSponsoredPostsMedianLikes: 1139,
    nonSponsoredPostsMedianViews: 59150,
    sponsoredPostsMedianLikes: 1171,
    sponsoredPostsMedianViews: 35087,
    audience: {
      countries: [
        { country: 'United States', percentage: 66 },
        { country: 'India', percentage: 5 },
        { country: 'United Kingdom', percentage: 5 },
        { country: 'Brazil', percentage: 3 },
        { country: 'United Arab Emirates', percentage: 2 },
      ],
      cities: [
        { city: 'Los Angeles', percentage: 15 },
        { city: 'New York City', percentage: 6 },
        { city: 'Miami', percentage: 5 },
        { city: 'New Orleans', percentage: 3 },
        { city: 'Gothenburg', percentage: 2 },
      ],
      languages: [
        { language: 'English', percentage: 90 },
        { language: 'Portuguese', percentage: 4 },
        { language: 'Spanish', percentage: 4 },
        { language: 'Arabic', percentage: 1 },
      ],
      ages: [
        { range: '13-17', percentage: 3 },
        { range: '18-24', percentage: 20 },
        { range: '25-34', percentage: 42 },
        { range: '35-44', percentage: 30 },
        { range: '45-64', percentage: 5 },
      ],
      genders: [
        { type: 'Female', percentage: 26 },
        { type: 'Male', percentage: 74 },
      ],
      interests: ['Fitness & Yoga', 'Restaurants, Food & Grocery', 'Television & Film', 'Shopping & Retail', 'Sports', 'Music'],
      credibility: null,
      notableUsers: [
        { userId: '192815961', username: 'gordongram', fullname: 'Gordon Ramsay', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZj4UrfWGAy5Wf6hqrZWyBGw3%2BfzGrsaw9yqcHr53%2BNLKuVjEs7m5xrDWQ0UL1NsUW4K0ClywKvSJbCLciqBvZfWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', followers: 19573118, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/gordongram' },
        { userId: '2107737265', username: 'alex_eubank15', fullname: 'Alex Eubank', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZaA66r0CnD4GFnNbQsizrHE9eiVabk0UHbQe8yhOeb1qQa0e0CTORqFERUMBNbVKjyja%2B1JTXd%2BaieVIr1a0m0Wwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', followers: 2721616, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/alex_eubank15' },
        { userId: '3075176944', username: 'jennifercoolidge', fullname: 'Jennifer Coolidge', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZqwMezQuCGaZDpqOPjbUqjzB2%2FhJDMta3m%2FVW5nN35rDVIl%2FDWtlSzZpaKdhb4Ko9W4DR8USNeDcc00f2EAjL3Wwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', followers: 2451874, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/jennifercoolidge' },
        { userId: '196238381', username: 'frank_medrano', fullname: 'Frank Medrano', picture: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDaou00V3dIWSDHq8sLncF6YpQOF8dhPMCZScDqGHP2ubCK5aq7yBZuzWyHAfZbC0gPtprDtLwa4OVrca%2FoOY5j%2B', followers: 2472843, isVerified: false, engagementRate: null, url: 'https://www.instagram.com/frank_medrano' },
      ],
    },
    recentPosts: [
      { id: '3805987131043488645', url: 'https://www.instagram.com/p/DTRlSF1jiOF/', caption: 'Easy, simple, healthy @menufit.app', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Itim7ocu%2Boykjr5KiRa2sY6imNRYw0iH0piJPzXf5CpHHCnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 3882, comments: 82, shares: null, created: '2026-01-09T03:24:03.000+00:00' },
      { id: '3792928921395025047', url: 'https://www.instagram.com/p/DSjMMIaDlSX/', caption: 'Save your macros download @menufit.app', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItirpGD5A%2FmiWq7rCFB9PRW5oWw%2BrsdP2FZj%2FoMyYlG90DnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 402, comments: 23, shares: null, created: '2025-12-22T02:59:43.000+00:00' },
      { id: '3789905665310508074', url: 'https://www.instagram.com/p/DSYcx9xEsQq/', caption: 'Save your macros, use @menufit.app', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Itihm35HgP%2Fja9g2xKBsOH6WOZtCMO3DAfiiIv7tPUs7eznMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 777, comments: 26, shares: null, created: '2025-12-17T22:53:03.000+00:00' },
      { id: '3784793854558942376', url: 'https://www.instagram.com/p/DSGSfVBETSo/', caption: '🍔 The Secret In-N-Out Orders They Don\'t Want You To Know About 👀 @menufit.app', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2ItikDrmcE8oeWu5FqklLC%2BujRPhheC5P%2FjsaA306vhLACsnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 5294, comments: 64, shares: null, created: '2025-12-10T21:36:48.000+00:00' },
      { id: '3781951578472324423', url: 'https://www.instagram.com/p/DR8MOxIkh1H/', caption: 'Comment "APP" for the link to get @menufit.app', thumbnail: 'https://imgigp.modash.io/p2?TtpRtyEyBiyQVjkfk2Ititx%2Bi9QasHTo%2BwCWeoRcu5sPxjojgdXIuSrck2N7iFRPnMD%2B9gheug32g3e9b38gPA%3D%3D', views: null, likes: 1179, comments: 43, shares: null, created: '2025-12-06T23:29:42.000+00:00' },
    ],
    popularPosts: [
      { id: '3573745190301026911', url: 'https://www.instagram.com/p/DGYflDpp0pf/', caption: 'Comment "Food" for UPDATED Fast Food Guide 🍔 #diet #healthy #protein #fitness', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDboR4AmbsNTlTMkxojcVkWGflUI8tu7ybnHypPWuIITs0%2Fe%2F0a8UEh%2Bc%2Bv6o66I%2BWSqjwP2tv6ZN2Xya9CckmVAWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D', views: null, likes: 399323, comments: 85529, shares: null, created: '2025-02-22T17:01:28.000+00:00' },
      { id: '3357107071642841821', url: 'https://www.instagram.com/p/C6W1xhOOTLd/', caption: 'Ronaldo\'s famous Ab Workout #gym #gymmotivation #fitness #ronaldo', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZYmZ4eGQ1lFBg%2BQ9O%2FU0LcDNV6aGgflqUu68rPvLPgCtt98Co6iFRyOkncmSUCZdx45OfFWRix8iI%2FvKklw0m%2BgNlJUwVYqIiahjW32e%2BqWA%3D%3D', views: 12094427, likes: 368702, comments: 449, shares: null, created: '2024-04-29T19:21:34.000+00:00' },
      { id: '3510057362836996534', url: 'https://www.instagram.com/p/DC2OpMNJMG2/', caption: 'Comment "FOOD" for Fast Food Secret Menu 🍔 #gym #diet #chickfila #protein', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZuBsMrjz9pWUFUC0x1z%2BfEnn30Kgt%2Fk48EcDj6jfk2yCoi%2BB2FeMv9omnblIQtBlg1sh9Hofg80%2B90mjrGsuUNXt%2FYzeksBPYLUknr5ild2A%3D%3D', views: null, likes: 182067, comments: 55108, shares: null, created: '2024-11-26T20:07:43.000+00:00' },
      { id: '3544854502813538847', url: 'https://www.instagram.com/p/DEx2mOMpRof/', caption: 'Cookbook on SALE! @walmart #levelsprotein @levelsprotein #walmart', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZYmZ4eGQ1lFBg%2BQ9O%2FU0LcipTNkUaNOIyUXZHCteG%2FD5len%2BnEj3PWyEA9uf8Qjpf9dDDVaFtdVctPr5HHb6gJXt%2FYzeksBPYLUknr5ild2A%3D%3D', views: null, likes: 162498, comments: 219, shares: null, created: '2025-01-13T20:25:17.000+00:00' },
      { id: '3540476920563252861', url: 'https://www.instagram.com/p/DEiTQBBpD59/', caption: '@levelsprotein 1,500 Calorie Bulking Shake 😳 #gym #diet #protein', thumbnail: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZWWcgkBNQqUD%2BXcblc3nVq4cdN0goSa2e%2FovzEbCgBhzXJXgL98NuHZho7mA4MTe0GEQICt83O21FJfPjjFtnNrOPQt%2BBH8xfdE2dL1avFgg%3D%3D', views: null, likes: 145043, comments: 481, shares: null, created: '2025-01-07T19:24:25.000+00:00' },
    ],
    sponsoredPosts: [
      { id: 'DTRlSF1jiOF', url: 'https://www.instagram.com/p/DTRlSF1jiOF', caption: 'Easy, simple, healthy @menufit.app', thumbnail: 'https://images.od.modash.io/e1141226a6a052da518215f391025205ccc820b5', views: null, likes: 3891, comments: 85, shares: null, created: '2026-01-09T03:24:03.000Z', mentions: ['menufit.app', 'colekosco'] },
      { id: 'DSjMMIaDlSX', url: 'https://www.instagram.com/p/DSjMMIaDlSX', caption: 'Save your macros download @menufit.app', thumbnail: 'https://images.od.modash.io/a9cce97f110269403012a4f48c038a8324511ee7', views: null, likes: 403, comments: 23, shares: null, created: '2025-12-22T02:59:43.000Z', mentions: ['menufit.app', 'colekosco'] },
      { id: 'DSYcx9xEsQq', url: 'https://www.instagram.com/p/DSYcx9xEsQq', caption: 'Save your macros, use @menufit.app', thumbnail: 'https://images.od.modash.io/3cb066c6da1ce287502803f474f45a192d28cd4c', views: null, likes: 781, comments: 26, shares: null, created: '2025-12-17T22:53:03.000Z', mentions: ['menufit.app', 'colekosco'] },
      { id: 'DSGSfVBETSo', url: 'https://www.instagram.com/p/DSGSfVBETSo', caption: 'The Secret In-N-Out Orders 🍔 @menufit.app', thumbnail: 'https://images.od.modash.io/aaf999b86b65fb9dbb96f24748c120e56de56430', views: null, likes: 5477, comments: 66, shares: null, created: '2025-12-10T21:36:48.000Z', mentions: ['menufit.app', 'colekosco'] },
      { id: 'DR8MOxIkh1H', url: 'https://www.instagram.com/p/DR8MOxIkh1H', caption: 'Comment "APP" for the link to get @menufit.app', thumbnail: 'https://images.od.modash.io/cc6d836449ec23ee03a557afa01bab50c13a46e4', views: null, likes: 1181, comments: 43, shares: null, created: '2025-12-06T23:29:42.000Z', mentions: ['menufit.app', 'colekosco'] },
    ],
    statHistory: [
      { month: '2025-08', followers: 278751, following: 2970, avgLikes: 5694, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-09', followers: 273736, following: 3032, avgLikes: 1557, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-10', followers: 271106, following: 3122, avgLikes: 2363, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-11', followers: 268692, following: 3138, avgLikes: 2123, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2025-12', followers: 265937, following: 3148, avgLikes: 3537, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-01', followers: 261669, following: 3166, avgLikes: 3095, avgViews: 0, avgComments: 0, avgShares: null },
      { month: '2026-02', followers: 257734, following: 3180, avgLikes: 4131, avgViews: 0, avgComments: 0, avgShares: null },
    ],
  },
  'tiktok:dylanasuarez': {
    followers: 9999,
    engagementRate: 6.4,
    sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5J7TeKh0ZEBR026e3SbZ2zlI1hu5l%2FBllGBWaUUBrUa5pzjGDtlInvUplh%2B%2BPx1qvjkxnQU968Rp9vwUAZ9M%2F5wg5wjaQPsN7lXz%2FNh%2BeaLQP7%2F319P2k%2F1dcITajqRah',
    displayName: 'dylanasuarez',
    bio: 'Fashion, 📸✍️',
    avgLikes: 395,
    avgComments: 4,
    avgViews: 1400631,
    avgShares: 17,
    postsCount: 208,
    postingFrequency: null,
    country: 'US',
    gender: 'female',
    ageGroup: '25-34',
    accountType: null,
    isPrivate: false,
    audience: {
      countries: [
        { country: 'Brazil', percentage: 26 },
        { country: 'United States', percentage: 14 },
        { country: 'Bangladesh', percentage: 12 },
        { country: 'Russia', percentage: 9 },
        { country: 'Pakistan', percentage: 8 },
      ],
      cities: [],
      languages: [
        { language: 'Portuguese', percentage: 39 },
        { language: 'English', percentage: 33 },
        { language: 'Russian', percentage: 19 },
        { language: 'Arabic', percentage: 4 },
        { language: 'Spanish', percentage: 1 },
      ],
      ages: [
        { range: '13-17', percentage: 5 },
        { range: '18-24', percentage: 49 },
        { range: '25-34', percentage: 34 },
        { range: '35-44', percentage: 8 },
        { range: '45+', percentage: 3 },
      ],
      genders: [
        { type: 'Male', percentage: 46 },
        { type: 'Female', percentage: 54 },
      ],
      interests: ['Fashion', 'Style', 'Photography', 'Lifestyle'],
      credibility: null,
      notableUsers: [
        { userId: '6816331748706141190', username: 'freepeople', fullname: 'Free People', picture: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdndcWjI1YCUI7Ntb7Q3CSKWkz85JAQVH2piLOyN24%2B3Bwl9XDgh1foxDovGxCAed6tOyGoPg1kdpKQXjNsm0Bz9xPILAM8fpD0MvXCujQ%2BitL8Z8i8JvgFZ8PPdUsb%2FB%2B', followers: 422800, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6816331748706141190' },
        { userId: '6764156219622081541', username: 'hummusbirrd', fullname: 'Brigette Muller @hummusbirrd', picture: 'https://imgigp.modash.io/v2?Ks%2FFXRbZf%2Blvn%2BwWMyRIs2t8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5dm8Ky3Qr2AYn6eDs46PyK%2Fno8Xa%2F5zKoIeyruzsCet671pu%2BjppkqlZlFilYIRoAEnK7Suo%2FR8Sst0UDPGMdLvU32HbHMGwuGaH7BDXk0YFX4i4Lw%2BWX3PgVigXy1g5d', followers: 422600, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6764156219622081541' },
        { userId: '6731806233273369605', username: 'francislola', fullname: 'Francis Lola', picture: 'https://imgigp.modash.io/v2?Ks%2FFXRbZf%2Blvn%2BwWMyRIs2t8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5dm8Ky3Qr2AYn6eDs46PyKygrwdbC7Qw5p9ZmaN28YYu2BAqFKAd%2BQJCRSLZlrX4oKy0LCNzc1IpmtxIT69vNlPU32HbHMGwuGaH7BDXk0YFX4i4Lw%2BWX3PgVigXy1g5d', followers: 329200, isVerified: false, engagementRate: null, url: 'https://www.tiktok.com/share/user/6731806233273369605' },
      ],
    },
    recentPosts: [
      { id: '7609034125525175583', url: 'https://www.tiktok.com/@dylanasuarez/video/7609034125525175583', caption: 'My dream lipgloss is here: @ILIA Beauty\'s Overglaze Hydrating Lip Gloss in Enamel and Studio.', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHSb2gh514pMSKu61HCKgr4DGL7XLyduKhD9c4k4nhsJ2CKR5AexTPR%2BttCbF7w8%2FTY570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 257, likes: 12, comments: 0, shares: 0, created: '2026-02-20T19:38:58.000+00:00' },
      { id: '7607848436439764255', url: 'https://www.tiktok.com/@dylanasuarez/video/7607848436439764255', caption: 'Some places are meant to feel other worldly. #ASMR from my stay at Basaratei in Shima, Japan.', thumbnail: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5mzWQ%2B7IYXnWjwc3JR2GJoguoQrUjlXnVpgA96YNuwF8FWiwidY9MpGZEPLKVOxjZitbwXbeLF6vdJNn0Lpwq3PltY7ARoU2N%2F%2BKtikvkuhZgDAlk%2ByWDbYhRxSYhm9X76s49C34EfzF90TZ0vVq8WC', views: 482, likes: 35, comments: 3, shares: 0, created: '2026-02-17T14:58:05.000+00:00' },
      { id: '7607453745382788382', url: 'https://www.tiktok.com/@dylanasuarez/video/7607453745382788382', caption: 'A sunny day out running around the city during New York Fashion Week in the @Bared Footwear Remiz boot.', thumbnail: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5mzWQ%2B7IYXnWjwc3JR2GJoguoQrUjlXnVpgA96YNuwF8DCWKt4zXOvUbYnzeF%2F5fhhHowTGaJ6waRtU5ibDa3%2BNhAS0X4%2FFhpZGPC2YEB2mCADAlk%2ByWDbYhRxSYhm9X76s49C34EfzF90TZ0vVq8WC', views: 144, likes: 8, comments: 3, shares: 0, created: '2026-02-16T13:26:41.000+00:00' },
      { id: '7606053449574206750', url: 'https://www.tiktok.com/@dylanasuarez/video/7606053449574206750', caption: 'Theres\'s a reason why my MSN messenger username was Dydiva. #childhood #babyphotos #diva', thumbnail: null, views: 631, likes: 42, comments: 2, shares: 2, created: '2026-02-12T18:52:15.000+00:00' },
      { id: '7600809689021992222', url: 'https://www.tiktok.com/@dylanasuarez/video/7600809689021992222', caption: 'I\'m always looking for ways to bring more soft energy & romance to these winter days. #PerrierPartner', thumbnail: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5mzWQ%2B7IYXnWjwc3JR2GJoguoQrUjlXnVpgA96YNuwF8DCWKt4zXOvUbYnzeF%2F5fhhHowTGaJ6waRtU5ibDa3%2BNhAS0X4%2FFhpZGPC2YEB2mCADAlk%2ByWDbYhRxSYhm9X76s49C34EfzF90TZ0vVq8WC', views: 21000000, likes: 3983, comments: 14, shares: 242, created: '2026-01-29T15:44:02.000+00:00' },
    ],
    popularPosts: [
      { id: '7509895575538634015', url: 'https://www.tiktok.com/@dylanasuarez/video/7509895575538634015', caption: 'From a lipstick touch up in the park, to an inspiring art exhibit — @Maison Perrier USA brings sophistication. #PerrierPartner', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHSb2gh514pMSKu61HCKgr4DGL7XLyduKhD9c4k4nhsJ2CKR5AexTPR%2BttCbF7w8%2FTY570yX1YZGRCI7kH1YIaNtAG5fb9UnvELFT56QIgnDy', views: 34600000, likes: 5982, comments: 14, shares: 319, created: '2025-05-29T15:50:34.000+00:00' },
      { id: '7600809689021992222', url: 'https://www.tiktok.com/@dylanasuarez/video/7600809689021992222', caption: 'Soft energy & romance to these winter days. #PerrierPartner', thumbnail: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5mzWQ%2B7IYXnWjwc3JR2GJoguoQrUjlXnVpgA96YNuwF8DCWKt4zXOvUbYnzeF%2F5fhhHowTGaJ6waRtU5ibDa3%2BNhAS0X4%2FFhpZGPC2YEB2mCADAlk%2ByWDbYhRxSYhm9X76s49C34EfzF90TZ0vVq8WC', views: 19700000, likes: 3730, comments: 13, shares: 227, created: '2026-01-29T15:44:02.000+00:00' },
      { id: '7475415927035546910', url: 'https://www.tiktok.com/@dylanasuarez/video/7475415927035546910', caption: 'Fashionable, sophisticated & full of energy — @maisonperrierusa. #FeelElevated #PerrierPartner', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna%2F74S3qS1hXBKXdYscw%2FiPF%2FotSgF1R7vBuDBwT%2FvC9m6W4erpGPAT0V8%2FFvoXyWoLb3CWjsd7kRaG4yzFTtVD6d%2FRR5KiSCU%2FHIwjeLkqYCQ%3D%3D', views: 12100000, likes: 3429, comments: 18, shares: 119, created: '2025-02-25T17:52:35.000+00:00' },
      { id: '7482930633048657182', url: 'https://www.tiktok.com/@dylanasuarez/video/7482930633048657182', caption: '@asos launched a new London-based, women-led brand, called ARRANGE. #spring #fashion #style #unboxing', thumbnail: 'https://imgigp.modash.io/v2?Ks%2FFXRbZf%2Blvn%2BwWMyRIs2t8VZOFcFEb4OJcMrjtna%2F74S3qS1hXBKXdYscw%2FiPF%2FotSgF1R7vBuDBwT%2FvC9m4Fm0ubCl09B7BMcRDXA3fM%2BxrHo6ciybcSF%2BUvJh9EeZQEScsLQxmYVX8tNtTKDGw%3D%3D', views: 1100000, likes: 2105, comments: 35, shares: 91, created: '2025-03-17T23:53:00.000+00:00' },
      { id: '7538126977526435103', url: 'https://www.tiktok.com/@dylanasuarez/video/7538126977526435103', caption: 'Dressing inspired by the Chloé runway. #grwm #ootd #styling #fashion', thumbnail: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY58%2FeF%2FRWR79hXN7NQ%2FqaEHTofDsTsfP%2Bj2i81BumDuMzUwBvj72zDwA46lxBZF8bUlYVS6VIemxGIMNkbZeKOtA11gl115t24pgbUjv5mmkKkkXX40A%2FMnF6T0r6uLRXz', views: 1724, likes: 155, comments: 3, shares: 1, created: '2025-08-13T17:43:04.000+00:00' },
    ],
    sponsoredPosts: [
      { id: '7516231112444661022', url: 'https://www.tiktok.com/@dylanasuarez/video/7516231112444661022', caption: '#ad @DonJulioTequila Por Amor: An Immersive Tasting Experience at Mercer Labs.', thumbnail: 'https://images.od.modash.io/199a0befb24548ce1bf8e413bc90314cc31489c1', views: 335, likes: 11, comments: 1, shares: 2, created: '2025-06-15T17:35:48.000Z', mentions: ['donjuliotequilamx'] },
      { id: '7509895575538634015', url: 'https://www.tiktok.com/@dylanasuarez/video/7509895575538634015', caption: '@Maison Perrier USA brings sophistication. #PerrierPartner #FeelElevated #MaisonPerrier', thumbnail: 'https://images.od.modash.io/b571d0e427a517e2112ed8108c7760b09b93dbf6', views: 34600000, likes: 5981, comments: 14, shares: 319, created: '2025-05-29T15:50:34.000Z', mentions: ['maisonperrierusa'] },
      { id: '7502457816653778206', url: 'https://www.tiktok.com/@dylanasuarez/video/7502457816653778206', caption: 'Quick outfit check for dinner with @Vestiaire Collective. #ootd #style #fashion', thumbnail: 'https://images.od.modash.io/ac81224775f65e0cebf4efdfdc2a7d0c070c60ef', views: 1364, likes: 104, comments: 2, shares: 0, created: '2025-05-09T14:48:35.000Z', mentions: ['vestiairecollective'] },
      { id: '7490684997909646623', url: 'https://www.tiktok.com/@dylanasuarez/video/7490684997909646623', caption: 'It\'s a work from home sort of day with my USM Haller 2 desk. #DWRPartner', thumbnail: 'https://images.od.modash.io/387e81ec0c703035cf6a36fe102b787b6b5554d7', views: 2701, likes: 141, comments: 4, shares: 10, created: '2025-04-07T21:24:00.000Z', mentions: ['designwithinreach_'] },
      { id: '7475415927035546910', url: 'https://www.tiktok.com/@dylanasuarez/video/7475415927035546910', caption: 'Fashionable, sophisticated & full of energy. #FeelElevated #PerrierPartner', thumbnail: 'https://images.od.modash.io/ed374c05b0e603f6a2cbee96e74f9808da31e49b', views: 12100000, likes: 3430, comments: 18, shares: 119, created: '2025-02-25T17:52:35.000Z', mentions: ['maisonperrierusa'] },
    ],
    statHistory: [
      { month: '2025-08', followers: 9636, following: 744, avgLikes: 654, avgViews: 3460960, avgComments: 4, avgShares: 33 },
      { month: '2025-09', followers: 9637, following: 745, avgLikes: 154, avgViews: 562207, avgComments: 2, avgShares: 7 },
      { month: '2025-10', followers: 9622, following: 749, avgLikes: 107, avgViews: 254558, avgComments: 2, avgShares: 4 },
      { month: '2025-11', followers: 9618, following: 753, avgLikes: 227, avgViews: 911805, avgComments: 3, avgShares: 10 },
      { month: '2025-12', followers: 9626, following: 757, avgLikes: 67, avgViews: 943, avgComments: 3, avgShares: 0 },
      { month: '2026-01', followers: 9615, following: 759, avgLikes: 57, avgViews: 808, avgComments: 3, avgShares: 0 },
      { month: '2026-02', followers: 9970, following: 756, avgLikes: 395, avgViews: 1850599, avgComments: 4, avgShares: 21 },
    ],
  },
};

// Pre-seed cache with demo profiles on module load
for (const [key, data] of Object.entries(DEMO_PROFILES)) {
  const [platform] = key.split(':');
  cache[key] = { platform, data };
}

export function getCachedModashData(platform: string, username: string): any | null {
  const key = `${platform}:${username.toLowerCase()}`;
  return cache[key]?.data ?? null;
}

export function isModashPrefetched(): boolean {
  return prefetched;
}

export async function prefetchAllModashProfiles(): Promise<void> {
  if (prefetched || prefetching) return;
  prefetching = true;

  const profiles = mockInfluencers.map(inf => {
    if (inf.instagram_username) return { platform: 'instagram', username: inf.instagram_username };
    if (inf.tiktok_username) return { platform: 'tiktok', username: inf.tiktok_username };
    return null;
  }).filter(Boolean) as { platform: string; username: string }[];

  await Promise.allSettled(
    profiles.map(async ({ platform, username }) => {
      const key = `${platform}:${username.toLowerCase()}`;
      // Skip if already in cache (demo profiles are pre-seeded)
      if (cache[key]) return;
      try {
        const { data, error } = await supabase.functions.invoke('modash-profile', {
          body: { platform, username },
        });
        if (!error && data && !data.error) {
          cache[key] = { platform, data: data.data };
        }
      } catch (err) {
        console.error(`Failed to prefetch Modash profile for ${username}:`, err);
      }
    })
  );

  prefetched = true;
  prefetching = false;
}
