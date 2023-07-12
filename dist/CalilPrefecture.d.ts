type PrefecturePrefix = 'Tokyo_';
type PrefectureName = 'Adachi' | 'Akiruno' | 'Akishima' | 'Arakawa' | 'Bunkyo' | 'Chiyoda' | 'Chofu' | 'Chuo' | 'Edogawa' | 'Fuchu' | 'Fussa' | 'Hachijo' | 'Hachioji' | 'Hamura' | 'Higashikurume' | 'Higashimurayama' | 'Higashiyamato' | 'Hino' | 'Hinode' | 'Inagi' | 'Itabashi' | 'Katsushika' | 'Kita' | 'Kiyose' | 'Kodaira' | 'Koganei' | 'Kokubunji' | 'Komae' | 'Koto' | 'Kunitachi' | 'Machida' | 'Meguro' | 'Minato' | 'Mitaka' | 'Mizuho' | 'Musashimurayama' | 'Musashino' | 'Nakano' | 'NDL' | 'Nerima' | 'Niijima' | 'Nishitokyo' | 'Okutama' | 'Ome' | 'Ota' | 'Koganei' | 'Setagaya' | 'Shibuya' | 'Shinagawa' | 'Shinjuku' | 'Suginami' | 'Sumida' | 'Tachikawa' | 'Taito' | 'Tama' | 'Toshima';
export type Prefecture = `${PrefecturePrefix}${PrefectureName}`;
export declare const PrefectureList: [Prefecture, string][];
export {};
