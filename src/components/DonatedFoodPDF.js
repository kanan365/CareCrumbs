// components/DonatedFoodPDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 40,
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
    padding: 5,
  },
  name: { width: '25%' },
  quantity: { width: '10%' },
  date: { width: '25%' },
  org: { width: '20%' },
  location: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: 'grey',
  },
});

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// PDF Document component
const DonatedFoodPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Donated Food Items Report</Text>
        <Text style={styles.subtitle}>Generated on {formatDate(new Date())}</Text>
      </View>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.name]}>Food Item</Text>
          <Text style={[styles.tableCell, styles.quantity]}>Quantity</Text>
          <Text style={[styles.tableCell, styles.date]}>Donation Date</Text>
          <Text style={[styles.tableCell, styles.org]}>Organization</Text>
          <Text style={[styles.tableCell, styles.location]}>Location</Text>
        </View>

        {/* Table Body */}
        {data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.name]}>{item.name}</Text>
            <Text style={[styles.tableCell, styles.quantity]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.date]}>{formatDate(item.donationDate)}</Text>
            <Text style={[styles.tableCell, styles.org]}>{item.organization || 'N/A'}</Text>
            <Text style={[styles.tableCell, styles.location]}>{item.location || 'N/A'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Total Items Donated: {data.reduce((acc, item) => acc + item.quantity, 0)}</Text>
      </View>
    </Page>
  </Document>
);

export default DonatedFoodPDF;