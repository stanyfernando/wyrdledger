import { QRCodeSVG } from "qrcode.react";
import { Currency } from "@/types";

interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
}

interface InvoiceData {
  orderId: string;
  date: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
    address?: string;
  };
  items: OrderItem[];
  shipping: number;
  currency: Currency;
  bankDetails?: {
    holderName: string;
    accountNumber: string;
    bank: string;
    bankCode?: string;
    branch: string;
    branchCode: string;
    swiftCode: string;
  };
  paymentUrl?: string;
  paymentLabel?: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
}

// Format currency with comma separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const getCurrencySymbol = (currency: Currency) => {
    switch (currency) {
      case "LKR": return "LKR ";
      case "USD": return "$";
      case "GBP": return "£";
    }
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + data.shipping;

  // All styles are inline for consistent print output
  const styles = {
    container: {
      width: "210mm",
      minHeight: "297mm",
      padding: "20mm",
      margin: "0 auto",
      backgroundColor: "#ffffff",
      color: "#000000",
      fontFamily: "'Eingrantch Mono', monospace",
      fontSize: "12px",
      lineHeight: "1.4",
      boxSizing: "border-box" as const,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottom: "2px solid #000000",
      paddingBottom: "20px",
      marginBottom: "20px",
    },
    brandSection: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logo: {
      width: "60px",
      height: "60px",
      objectFit: "contain" as const,
    },
    brandName: {
      fontSize: "24px",
      fontWeight: "bold",
      letterSpacing: "0.05em",
      margin: 0,
    },
    titleSection: {
      textAlign: "right" as const,
    },
    invoiceTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      margin: 0,
    },
    statusPill: {
      display: "inline-block",
      padding: "4px 12px",
      fontSize: "11px",
      fontWeight: "bold",
      borderRadius: "9999px",
      marginTop: "8px",
      backgroundColor: "#000000",
      color: "#ffffff",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    customerIdSection: {
      marginBottom: "20px",
    },
    customerIdLabel: {
      fontSize: "12px",
      color: "#666666",
      margin: "0 0 6px 0",
    },
    customerIdPill: {
      display: "inline-block",
      padding: "6px 14px",
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: "monospace",
      backgroundColor: "#000000",
      color: "#ffffff",
      borderRadius: "6px",
    },
    sectionTitle: {
      fontSize: "12px",
      fontWeight: "bold",
      color: "#666666",
      marginBottom: "8px",
    },
    customerName: {
      fontWeight: "500",
      margin: "0 0 4px 0",
    },
    customerDetail: {
      fontSize: "12px",
      margin: "0 0 2px 0",
    },
    table: {
      width: "100%",
      marginBottom: "20px",
      borderCollapse: "collapse" as const,
    },
    tableHeader: {
      borderBottom: "2px solid #000000",
    },
    th: {
      textAlign: "left" as const,
      padding: "8px 0",
      fontSize: "12px",
      fontWeight: "bold",
    },
    thRight: {
      textAlign: "right" as const,
      padding: "8px 0",
      fontSize: "12px",
      fontWeight: "bold",
    },
    td: {
      padding: "12px 0",
      fontSize: "12px",
      borderBottom: "1px solid #cccccc",
      verticalAlign: "top" as const,
    },
    tdRight: {
      padding: "12px 0",
      fontSize: "12px",
      borderBottom: "1px solid #cccccc",
      textAlign: "right" as const,
      verticalAlign: "top" as const,
    },
    productName: {
      fontWeight: "500",
    },
    productId: {
      color: "#666666",
      fontSize: "11px",
    },
    totalsContainer: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "24px",
    },
    totalsBox: {
      width: "200px",
    },
    totalsRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      fontSize: "12px",
    },
    totalsFinal: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontWeight: "bold",
      borderTop: "2px solid #000000",
      marginTop: "8px",
    },
    paymentSection: {
      borderTop: "2px solid #000000",
      paddingTop: "20px",
    },
    paymentDescription: {
      fontSize: "12px",
      marginBottom: "16px",
      color: "#333333",
    },
    bankBox: {
      border: "1px solid #000000",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "12px",
      lineHeight: "1.6",
    },
    bankLine: {
      margin: 0,
      fontWeight: "500",
    },
    bankLineMono: {
      margin: 0,
      fontWeight: "500",
      fontFamily: "monospace",
    },
    importantBox: {
      marginTop: "16px",
      padding: "16px",
      backgroundColor: "#000000",
      borderRadius: "8px",
    },
    importantText: {
      fontSize: "12px",
      color: "#ffffff",
      margin: 0,
      fontWeight: "bold",
    },
    qrSection: {
      display: "flex",
      alignItems: "flex-start",
      gap: "24px",
    },
    qrContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
    },
    qrLabel: {
      fontSize: "11px",
      color: "#666666",
      marginTop: "8px",
    },
    paymentLinkBox: {
      flex: 1,
    },
    paymentLinkLabel: {
      fontSize: "12px",
      color: "#666666",
      marginBottom: "8px",
    },
    paymentLinkUrl: {
      fontSize: "11px",
      fontFamily: "monospace",
      wordBreak: "break-all" as const,
      color: "#2563eb",
      textDecoration: "underline",
    },
    footer: {
      marginTop: "32px",
      paddingTop: "20px",
      borderTop: "1px solid #cccccc",
      textAlign: "center" as const,
      fontSize: "11px",
      color: "#666666",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandSection}>
          <img 
            src="https://i.imgur.com/3tWFJXW.png" 
            alt="WYRD & WEFT" 
            style={styles.logo}
          />
          <h1 style={styles.brandName}>WYRD & WEFT</h1>
        </div>
        <div style={styles.titleSection}>
          <h2 style={styles.invoiceTitle}>INVOICE</h2>
          <span style={styles.statusPill}>Awaiting Payment</span>
        </div>
      </div>

      {/* Customer ID as Pill */}
      <div style={styles.customerIdSection}>
        <p style={styles.customerIdLabel}>Customer ID:</p>
        <span style={styles.customerIdPill}>{data.orderId}</span>
      </div>

      {/* Customer Details */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={styles.sectionTitle}>BILL TO:</h3>
        <p style={styles.customerName}>{data.customer.name}</p>
        <p style={styles.customerDetail}>{data.customer.email}</p>
        {data.customer.contact && <p style={styles.customerDetail}>{data.customer.contact}</p>}
        {data.customer.address && <p style={{ ...styles.customerDetail, marginTop: "4px" }}>{data.customer.address}</p>}
      </div>

      {/* Order Items Table */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>ITEM</th>
            <th style={styles.th}>SIZE</th>
            <th style={styles.th}>COLOR</th>
            <th style={styles.thRight}>PRICE</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index}>
              <td style={styles.td}>
                <span style={styles.productName}>{item.productName}</span>
                <br />
                <span style={styles.productId}>{item.productId}</span>
              </td>
              <td style={styles.td}>{item.size}</td>
              <td style={styles.td}>{item.color}</td>
              <td style={styles.tdRight}>
                {getCurrencySymbol(data.currency)}{formatCurrency(item.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={styles.totalsContainer}>
        <div style={styles.totalsBox}>
          <div style={styles.totalsRow}>
            <span>Subtotal:</span>
            <span>{getCurrencySymbol(data.currency)}{formatCurrency(subtotal)}</span>
          </div>
          <div style={styles.totalsRow}>
            <span>Shipping:</span>
            <span>{getCurrencySymbol(data.currency)}{formatCurrency(data.shipping)}</span>
          </div>
          <div style={styles.totalsFinal}>
            <span>TOTAL:</span>
            <span>{getCurrencySymbol(data.currency)}{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div style={styles.paymentSection}>
        <h3 style={styles.sectionTitle}>PAYMENT DETAILS:</h3>
        
        {data.currency === "LKR" && data.bankDetails ? (
          <>
            <p style={styles.paymentDescription}>Please make the payment to:</p>
            <div style={styles.bankBox}>
              <p style={styles.bankLine}>{data.bankDetails.holderName}</p>
              <p style={styles.bankLineMono}>{data.bankDetails.accountNumber}</p>
              <p style={styles.bankLine}>{data.bankDetails.bank}{data.bankDetails.bankCode && ` (${data.bankDetails.bankCode})`}</p>
              <p style={styles.bankLine}>{data.bankDetails.branch} ({data.bankDetails.branchCode})</p>
              <p style={styles.bankLineMono}>{data.bankDetails.swiftCode}</p>
            </div>
            <div style={styles.importantBox}>
              <p style={styles.importantText}>
                ⚠️ IMPORTANT: Please include your customer ID {data.orderId} as your payment reference.
              </p>
            </div>
          </>
        ) : (
          <>
            <p style={styles.paymentDescription}>Please scan the QR code to make the payment:</p>
            <div style={styles.qrSection}>
              {data.paymentUrl && (
                <div style={styles.qrContainer}>
                  <QRCodeSVG value={data.paymentUrl} size={120} />
                  <p style={styles.qrLabel}>Scan to pay</p>
                </div>
              )}
              <div style={styles.paymentLinkBox}>
                <p style={styles.paymentLinkLabel}>Payment Link:</p>
                <a href={data.paymentUrl} style={styles.paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                  {data.paymentUrl}
                </a>
                <div style={styles.importantBox}>
                  <p style={styles.importantText}>
                    ⚠️ IMPORTANT: Please include your customer ID {data.orderId} as your payment reference.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>Thank you for your order!</p>
        <p style={{ marginTop: "8px", fontSize: "10px" }}>
          Generated on {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}