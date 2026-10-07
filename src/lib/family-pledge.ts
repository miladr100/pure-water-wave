import type { UserLanguage } from "@/lib/user-languages";

export type FamilyPledgeScript = "locale" | "romanized" | "hangul";

export type FamilyPledgeItem = {
  number: number;
  text: string;
};

const PLEDGE_PT = [
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura estabelecer o Reino dos Céus, na Terra e no Céu, o ideal original da criação, pela restauração da Terra Natal Original.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura realizar perfeitamente o caminho dos filhos de piedade filial na família, dos patriotas na nação, dos santos no mundo e da família dos filhos e filhas divinos no cosmo, dedicando-nos aos Pais Celestiais e aos Verdadeiros Pais e tornando-nos uma família central que representa o cosmo.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura realizar perfeitamente os Quatro Grandes Reinos do Coração, as Três Grandes realezas, e o Reino da Família Real.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura realizar perfeitamente o mundo de liberdade, paz, unidade e felicidade, através da criação de uma grande família em nível cósmico que é o ideal da criação dos Pais Celestiais.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura lutar, diariamente, por um maior desenvolvimento da unidade entre o mundo espiritual, sujeito, e o mundo físico, objeto.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura tornar-se uma família ideal, que multiplica as bênçãos do Céu para nosso próximo, sendo a família que representa os Pais Celestiais e os Verdadeiros Pais e que pode mobilizar a fortuna celeste.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura realizar perfeitamente, através da vivência para servir os outros, o mundo da cultura do coração que está conectado com a linhagem de sangue original.",
  "Nossa família, como dona do Cheon Il Guk, centralizada no Amor Verdadeiro, jura realizar perfeitamente a esfera da libertação interna e externa do Reino dos Céus, na Terra e no Céu, através da Era do Cheon Il Guk, com fé absoluta, amor absoluto e obediência absoluta, pelo ideal da unidade em amor entre os Pais Celestiais e o homem.",
] as const;

const PLEDGE_EN = [
  "Our family, the owner of Cheon Il Guk, pledges to seek our original homeland and build the Kingdom of God on earth and in heaven, the original ideal of creation, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges to represent and become central to heaven and earth by attending the Heavenly Parent and True Parents; we pledge to perfect the dutiful family way of filial sons and daughters in our family, patriots in our nation, saints in the world, and divine sons and daughters in heaven and on earth, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges to perfect the Four Great Realms of Heart, the Three Great Kingships and the Realm of the Royal Family, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges to build the universal family encompassing heaven and earth, which is the Heavenly Parent’s ideal of creation, and perfect the world of freedom, peace, unity and happiness, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges to strive every day to advance the unification of the spirit world and the physical world as subject and object partners, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges to become a family that moves heavenly fortune by embodying the Heavenly Parent and True Parents, and to perfect a family that conveys Heaven’s blessing to our community, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges, through living for the sake of others, to perfect the world based on the culture of the heart, which is rooted in the original lineage, by centering on true love.",
  "Our family, the owner of Cheon Il Guk, pledges, having entered the Era of Cheon Il Guk, to achieve the ideal of God and human beings united in love through absolute faith, absolute love and absolute obedience, and to perfect the realm of liberation and complete freedom in the Kingdom of God on earth and in heaven, by centering on true love.",
] as const;

const PLEDGE_ES = [
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, restaurar nuestra tierra natal original y fundar el ideal original de la creación, el reino de los cielos en la tierra y en el cielo.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero y en asistencia a los Padres Celestiales y a los Padres Verdaderos, ser una familia central del cosmos, representarlo perfeccionando el deber moral de ser hijos de piedad filial en el hogar, patriotas ante la nación, santos ante el mundo y una familia de hijos sagrados ante el cosmos.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, perfeccionar las cuatro grandes esferas del corazón, los tres grandes reinados y el ámbito de una familia real.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, crear una gran familia universal, el ideal divino de la creación, y perfeccionar un mundo de libertad, paz, unidad y felicidad.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, promover a diario un desarrollo progresivo hacia la unidad del mundo celestial subjetivo con el mundo terrenal objetivo.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, ser una familia que movilice la fortuna celestial en lugar de los Padres Celestiales y los Padres Verdaderos, y perfeccione una familia que conecte a nuestro entorno con la bendición celestial.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, mediante una vida de servicio en conexión al linaje original, perfeccionar el mundo de la cultura del corazón.",
  "Nuestra familia, soberana del Cheon Il Guk, promete, con amor verdadero, al entrar en la era del Cheon Il Guk, realizar el ideal de la unidad del amor divino y el amor humano con fe, amor y obediencia absolutos, y perfeccionar la liberación de los reinos terrenal y celestial.",
] as const;

const PLEDGE_HANGUL = [
  "천일국 주인 우리 가정은 참사랑을 중심하고, 본향땅을 찾아, 본연의 창조이상인 지상천국과 천상천국을 창건할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 하늘부모님과 참부모님을 모시어 천주의 대표적, 가정이 되며, 중심적 가정이 되어 가정에서는 효자, 국가에서는 충신, 세계에서는 성인, 천주에서는 성자의 가정의 도리를 완성할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 사대심정권과 삼대왕권과 황족권을 완성할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 하늘부모님의 창조이상인 천주대가족을 형성하여 자유와 평화와 통일과 행복의 세계를 완성할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 매일 주체적 천상세계와 대상적 지상세계의 통일을 향해 전진적 발전을 촉진화할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 하늘부모님과 참부모님의 대신가정으로서 천운을 움직이는 가정이 되어, 하늘의 축복을 주변에 연결시키는 가정을 완성할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 본연의 혈통과 연결된 위하는 생활을 통하여 심정문화세계를 완성할 것을 맹세하나이다.",
  "천일국 주인 우리 가정은 참사랑을 중심하고, 천일국시대를 맞이하여 절대신앙 절대사랑 절대복종으로 신인애 일체이상을 이루어 지상천국과 천상천국의 해방권과 석방권을 완성할 것을 맹세하나이다.",
] as const;

const PLEDGE_ROMANIZED = [
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Bôn-Hiáng-Dáng-ûl Tchajá Bônión-ûi Tchang-djo-isáng-in Dji Sáng Tchóng Guk goá Tchóng Sáng Tchón Guk-ul Tcháng Gón Hál Gósûl Méngsê-Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Hánul Bu Mo Nim-goá Tchám Bu Mo Nim-ûl Môchió Tchón-Ju-uí Dé-phiô-djók Kadjóng-í Dêmió Djung-Shim-djók Kadjóng-í Doêó Kadjóng-ê-sónûn Hiô-djá, Kuka-êsónun Tchung-Shin, Sê-Guie-Êsónun Seóng-in Tchón-djuê-sónun Seong-já-ui Kadjóng-ui Dôri-rûl Uánsóng-Hál Gósûl Méngsê-Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Sade Shim Djóng Kuón gôa Sám Dé Oáng kuón goá, Hûang-jôk Guón ûl Uánsóng-Hál Gósûl Méngsê Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Hánul Bu Mo Nim-ûi Tcháng-djô-isáng-in Tcheon-ju-Dekadjôk-ûl Hióngsóng-Haió, Djaiú-oá Phióng-huá-oá Tông-il-gôa Hengbok-ûi Seguiê-rûl Uánsóng-Hál Gósul Méngsê Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung Shim Hagô Meil Djutchê djók Tchón-sáng sêguiê oá Dé sángdjók Djisáng sêguiê-ûi Tông il ûl Hiáng hé Djón djin djók Baldjón ûl Tchôk djin hûa hál Gósul Méngsê Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Hánul Bu Mo Nim-goá Tchám-Bu Mo Nim-ûi Déshin Kadjóng-ûrossó Tchón Un-ûl Umdjik-i-nûn Kadjóng-i Doeó Hánûl-uí Tchukbok-ûl Djubión-ê Íon-guiól-Shikinûn Kadjóng-ûl Uánsóng-Hál Gósul Méngsê Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Bom-ión-ûi Hiól-tông-goá Íon-kiól-doen Wi-ha-num seng-hwa-rul Tong-ha-yó Shimdjóng-Mun-huá-Seguie-rûl Uánsóng-Hál Gósul Méngsê Hanaidá.",
  "Tcheon il guk Juin Uri Kadjóng-ûn Tchám-Saráng-ul Djung-Shim Hagô Cheon-il-guk-shi-dê-rul Madji-haió Djól-dê-shin-am, Djól-dê-saráng / Djól-dê-bôk-djông-urô Shin-in-ê il-tché I-sang-ûl I-ru-ó Ji-sang-tcheon-guk-goá Tchón-sáng-tcheon-guk-ui Hê-bang-kuon-kua Sok-bang-kuon-ul Uánsóng-Hál Gósul Méngsê Hanaidá.",
] as const;

const LOCALE_TEXTS: Record<UserLanguage, readonly string[]> = {
  pt: PLEDGE_PT,
  en: PLEDGE_EN,
  es: PLEDGE_ES,
};

function toItems(texts: readonly string[]): FamilyPledgeItem[] {
  return texts.map((text, index) => ({
    number: index + 1,
    text,
  }));
}

export function getFamilyPledgeAudioUrl(number: number) {
  return `/family-pledge/item-${number}.mp3`;
}

export function getFamilyPledgeItems(
  script: FamilyPledgeScript,
  language: UserLanguage,
): FamilyPledgeItem[] {
  if (script === "hangul") {
    return toItems(PLEDGE_HANGUL);
  }

  if (script === "romanized") {
    return toItems(PLEDGE_ROMANIZED);
  }

  return toItems(LOCALE_TEXTS[language] ?? PLEDGE_PT);
}
