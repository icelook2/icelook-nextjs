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

// A4 size: 595pt x 842pt
const styles = StyleSheet.create({
  page: {
    width: 595,
    height: 842,
    padding: 48,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E5E5E5",
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  nickname: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 48,
  },
  qrCodeContainer: {
    marginBottom: 24,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  scanText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 8,
  },
  url: {
    fontSize: 16,
    color: "#1a1a1a",
    textAlign: "center",
    fontWeight: "bold",
  },
});

function IcelookLogo() {
  // Larger version of the logo for poster
  return (
    <Svg width={60} height={94} viewBox="0 0 390 609">
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
  return `${stars}${emptyStars} ${rating.toFixed(1)} (${reviewCount} reviews)`;
}

interface PosterPdfProps {
  data: PdfProfileData;
  scanText: string;
}

export function PosterPdf({ data, scanText }: PosterPdfProps) {
  const ratingText = formatRating(data.rating, data.reviewCount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <IcelookLogo />
        </View>

        <View style={styles.avatarContainer}>
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>

        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.nickname}>@{data.nickname}</Text>
        {ratingText && <Text style={styles.rating}>{ratingText}</Text>}

        <View style={styles.qrCodeContainer}>
          <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
        </View>

        <Text style={styles.scanText}>{scanText}</Text>
        <Text style={styles.url}>
          {data.profileUrl.replace(/^https?:\/\//, "")}
        </Text>
      </Page>
    </Document>
  );
}
