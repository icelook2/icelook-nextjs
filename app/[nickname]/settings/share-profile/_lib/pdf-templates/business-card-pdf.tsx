import {
  Document,
  Ellipse,
  Image,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PdfProfileData } from "../pdf-types";

// Standard business card size: 3.5" x 2" = 252pt x 144pt
const styles = StyleSheet.create({
  page: {
    width: 252,
    height: 144,
    padding: 12,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  leftSection: {
    flex: 1,
    justifyContent: "space-between",
  },
  profileInfo: {
    gap: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  nickname: {
    fontSize: 8,
    color: "#666666",
  },
  rating: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  url: {
    fontSize: 7,
    color: "#888888",
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrCode: {
    width: 70,
    height: 70,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E5E5",
  },
  logoContainer: {
    width: 24,
    height: 24,
  },
});

function IcelookLogo() {
  return (
    <Svg width={24} height={37} viewBox="0 0 390 609">
      <Ellipse cx={74.1} cy={78.08} rx={74.1} ry={70.27} fill="#A1FF06" />
      <Rect
        x={0}
        y={210.81}
        width={148.2}
        height={398.19}
        rx={74.1}
        fill="#FE4090"
      />
      <Rect
        x={241.8}
        y={0}
        width={148.2}
        height={609}
        rx={74.1}
        fill="#B358FB"
      />
    </Svg>
  );
}

function formatRating(rating: number, reviewCount: number): string {
  if (reviewCount === 0) {
    return "";
  }
  const stars = "★".repeat(Math.round(rating));
  const emptyStars = "☆".repeat(5 - Math.round(rating));
  return `${stars}${emptyStars} ${rating.toFixed(1)} (${reviewCount})`;
}

interface BusinessCardPdfProps {
  data: PdfProfileData;
}

export function BusinessCardPdf({ data }: BusinessCardPdfProps) {
  const ratingText = formatRating(data.rating, data.reviewCount);

  return (
    <Document>
      <Page size={[252, 144]} style={styles.page}>
        <View style={styles.container}>
          <View style={styles.leftSection}>
            <View style={styles.profileInfo}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {data.avatarUrl ? (
                  <Image src={data.avatarUrl} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
                <View>
                  <Text style={styles.name}>{data.name}</Text>
                  <Text style={styles.nickname}>@{data.nickname}</Text>
                </View>
              </View>
              {ratingText && <Text style={styles.rating}>{ratingText}</Text>}
            </View>
            <View style={styles.urlContainer}>
              <Text style={styles.url}>
                {data.profileUrl.replace(/^https?:\/\//, "")}
              </Text>
              <View style={styles.logoContainer}>
                <IcelookLogo />
              </View>
            </View>
          </View>
          <View style={styles.rightSection}>
            <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
