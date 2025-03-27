import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Tooltip,
  useTheme,
  alpha,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PieChartIcon from '@mui/icons-material/PieChart';
import DescriptionIcon from '@mui/icons-material/Description';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import InvestmentSimulationChart from './InvestmentSimulationChart';

// API Base URL
const API_BASE_URL = 'http://localhost:5002';

// Asset types
const ASSET_TYPES = ['Stock', 'ETF', 'Fund'];

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const InvestmentPortfolio = () => {
  const theme = useTheme();
  
  // State management
  const [investments, setInvestments] = useState([]);
  const [selectedInvestments, setSelectedInvestments] = useState([]);
  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    assetType: 'Stock',
    amount: '',
    name: ''
  });
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [validating, setValidating] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [assetAllocation, setAssetAllocation] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  // Calculate total investment and asset allocation when investments change
  useEffect(() => {
    if (investments.length > 0) {
      const total = investments.reduce((sum, investment) => sum + parseFloat(investment.amount || 0), 0);
      setTotalInvestment(total);

      // Calculate asset allocation for pie chart
      const allocation = [];
      const assetTypeCounts = {};
      
      investments.forEach(investment => {
        const { assetType, amount } = investment;
        const value = parseFloat(amount || 0);
        
        // Group by asset type
        if (assetTypeCounts[assetType]) {
          assetTypeCounts[assetType] += value;
        } else {
          assetTypeCounts[assetType] = value;
        }
      });
      
      // Convert to array for pie chart
      Object.keys(assetTypeCounts).forEach(type => {
        allocation.push({
          name: type,
          value: assetTypeCounts[type],
          percentage: ((assetTypeCounts[type] / total) * 100).toFixed(1)
        });
      });
      
      setAssetAllocation(allocation);
      
      // Initialize all investments as selected by default
      if (selectAll) {
        setSelectedInvestments(investments.map(inv => inv.id));
      }
    } else {
      setTotalInvestment(0);
      setAssetAllocation([]);
      setSelectedInvestments([]);
    }
  }, [investments, selectAll]);

  // Handle input changes for new investment
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvestment({
      ...newInvestment,
      [name]: value
    });
  };

  // Validate symbol using Yahoo Finance API
  const validateSymbol = async () => {
    if (!newInvestment.symbol) {
      showAlert('Please enter a symbol', 'error');
      return false;
    }

    try {
      setValidating(true);
      const response = await axios.get(`${API_BASE_URL}/api/validate-symbol?symbol=${newInvestment.symbol}`);
      
      if (response.data.status === 'success') {
        setNewInvestment({
          ...newInvestment,
          name: response.data.name || newInvestment.symbol
        });
        return true;
      } else {
        showAlert(`Invalid symbol: ${response.data.message}`, 'error');
        return false;
      }
    } catch (error) {
      showAlert(`Error validating symbol: ${error.message}`, 'error');
      return false;
    } finally {
      setValidating(false);
    }
  };

  // Add new investment to portfolio
  const addInvestment = async () => {
    if (!newInvestment.symbol || !newInvestment.amount || isNaN(parseFloat(newInvestment.amount))) {
      showAlert('Please enter a valid symbol and amount', 'error');
      return;
    }

    // Validate amount
    if (parseFloat(newInvestment.amount) <= 0) {
      showAlert('Amount must be greater than zero', 'error');
      return;
    }

    // Check for duplicate symbols
    const isDuplicate = investments.some(
      investment => investment.symbol.toUpperCase() === newInvestment.symbol.toUpperCase()
    );
    
    if (isDuplicate) {
      showAlert('This symbol is already in your portfolio', 'warning');
      return;
    }

    // Validate symbol against Yahoo Finance
    const isValid = await validateSymbol();
    if (!isValid) return;

    // Add to investments
    const investmentToAdd = {
      ...newInvestment,
      amount: parseFloat(newInvestment.amount),
      id: Date.now().toString()
    };

    setInvestments([...investments, investmentToAdd]);
    
    // Reset form
    setNewInvestment({
      symbol: '',
      assetType: 'Stock',
      amount: '',
      name: ''
    });

    showAlert('Investment added successfully', 'success');
  };

  // Remove investment from portfolio
  const removeInvestment = (id) => {
    setInvestments(investments.filter(investment => investment.id !== id));
    showAlert('Investment removed', 'info');
  };

  // Show alert
  const showAlert = (message, severity) => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  // Close alert
  const handleAlertClose = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  // Generate PDF report
  const generatePDF = () => {
    if (investments.length === 0) {
      showAlert('Add investments to generate a report', 'warning');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(22);
    doc.text('Investment Portfolio Summary', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
    
    // Total Investment
    doc.setFontSize(16);
    doc.text(`Total Investment: $${totalInvestment.toLocaleString()}`, 20, 45);
    
    // Asset Allocation Summary
    doc.setFontSize(16);
    doc.text('Asset Allocation', 20, 60);
    
    let yPos = 70;
    assetAllocation.forEach((asset, index) => {
      doc.setFontSize(12);
      doc.text(`${asset.name}: $${asset.value.toLocaleString()} (${asset.percentage}%)`, 30, yPos);
      yPos += 10;
    });
    
    // Investments Table
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Investment Details', 20, yPos);
    yPos += 10;
    
    // Table headers
    doc.setFontSize(12);
    doc.text('Symbol', 20, yPos);
    doc.text('Name', 60, yPos);
    doc.text('Type', 130, yPos);
    doc.text('Amount ($)', 170, yPos);
    yPos += 10;
    
    // Table rows
    investments.forEach((investment, index) => {
      // Add new page if needed
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
        
        // Table headers on new page
        doc.setFontSize(12);
        doc.text('Symbol', 20, yPos);
        doc.text('Name', 60, yPos);
        doc.text('Type', 130, yPos);
        doc.text('Amount ($)', 170, yPos);
        yPos += 10;
      }
      
      doc.text(investment.symbol, 20, yPos);
      doc.text(investment.name.substring(0, 30), 60, yPos); // Limit name length
      doc.text(investment.assetType, 130, yPos);
      doc.text(investment.amount.toLocaleString(), 170, yPos);
      yPos += 10;
    });
    
    // Recommendations and notes
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Investment Notes', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text([
      '• Remember to diversify your portfolio across different asset classes.',
      '• Consider your risk tolerance when selecting investments.',
      '• Regular portfolio rebalancing is recommended.',
      '• Consult with a financial advisor for personalized advice.'
    ], 20, yPos);
    
    // Save the PDF
    doc.save('Investment_Portfolio_Summary.pdf');
    showAlert('PDF report generated successfully', 'success');
  };

  // Get asset type color
  const getAssetTypeColor = (assetType) => {
    switch(assetType) {
      case 'Stock':
        return theme.palette.primary.main;
      case 'ETF':
        return theme.palette.secondary.main;
      case 'Fund':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Handle investment selection
  const handleInvestmentSelect = (id) => {
    setSelectedInvestments(prev => {
      if (prev.includes(id)) {
        return prev.filter(invId => invId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all toggle
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedInvestments(investments.map(inv => inv.id));
    } else {
      setSelectedInvestments([]);
    }
  };

  // Get selected investments data
  const getSelectedInvestmentsData = () => {
    return investments.filter(inv => selectedInvestments.includes(inv.id));
  };

  return (
    <Box sx={{ mt: 3, mb: 5 }}>
      <Card 
        elevation={2} 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Investment Portfolio
            </Typography>
          }
          subheader="Add funds, ETFs, and individual stocks to your portfolio and track your investments"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        />
        
        <CardContent sx={{ p: 3 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.5)
            }}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
              Add New Investment
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="asset-type-label">Asset Type</InputLabel>
                  <Select
                    labelId="asset-type-label"
                    name="assetType"
                    value={newInvestment.assetType}
                    label="Asset Type"
                    onChange={handleInputChange}
                  >
                    {ASSET_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Symbol"
                  name="symbol"
                  value={newInvestment.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g. AAPL, VTI"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Investment Amount ($)"
                  name="amount"
                  type="number"
                  value={newInvestment.amount}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addInvestment}
                  startIcon={validating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  disabled={validating}
                  fullWidth
                  sx={{ 
                    py: 1, 
                    borderRadius: 1.5,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  Add Investment
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {investments.length > 0 ? (
            <>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  Total Investment: ${totalInvestment.toLocaleString()}
                </Typography>
                <Tooltip title="Export portfolio summary to PDF">
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={generatePDF}
                    startIcon={<DescriptionIcon />}
                    sx={{ 
                      borderRadius: 1.5,
                      fontWeight: 500
                    }}
                  >
                    Export PDF
                  </Button>
                </Tooltip>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      mb: 3, 
                      boxShadow: 2,
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Table>
                      <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Tooltip title={selectAll ? "Deselect all" : "Select all"}>
                              <Checkbox 
                                checked={selectAll}
                                onChange={handleSelectAll}
                                indeterminate={selectedInvestments.length > 0 && selectedInvestments.length < investments.length}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Symbol</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount ($)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {investments.map((investment) => (
                          <TableRow 
                            key={investment.id}
                            hover
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              transition: 'all 0.2s',
                              backgroundColor: selectedInvestments.includes(investment.id) 
                                ? alpha(theme.palette.primary.main, 0.04)
                                : 'inherit'
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox 
                                checked={selectedInvestments.includes(investment.id)}
                                onChange={() => handleInvestmentSelect(investment.id)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{investment.symbol}</TableCell>
                            <TableCell>{investment.name}</TableCell>
                            <TableCell>
                              <Chip 
                                label={investment.assetType} 
                                color={
                                  investment.assetType === 'Stock' ? 'primary' : 
                                  investment.assetType === 'ETF' ? 'secondary' : 'success'
                                }
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                              ${investment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title={`Remove ${investment.symbol}`}>
                                <IconButton 
                                  size="small"
                                  edge="end" 
                                  aria-label="delete" 
                                  onClick={() => removeInvestment(investment.id)}
                                  color="error"
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: alpha(theme.palette.error.main, 0.1)
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {selectedInvestments.length !== investments.length && (
                    <Box 
                      sx={{ 
                        mb: 3,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}
                    >
                      <Typography variant="body2" color="info.main">
                        <strong>{selectedInvestments.length}</strong> of <strong>{investments.length}</strong> investments selected for simulation
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Paper sx={{ 
                      p: 2, 
                      mb: 3, 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      boxShadow: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.9)
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2
                      }}>
                        <PieChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Asset Allocation
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          height: 250,
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          p: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.5)
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={assetAllocation}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                labelLine={{ stroke: theme.palette.text.secondary, strokeWidth: 0.5 }}
                              >
                                {assetAllocation.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`}
                                    fill={
                                      entry.name === 'Stock' ? theme.palette.primary.main : 
                                      entry.name === 'ETF' ? theme.palette.secondary.main : 
                                      theme.palette.success.main
                                    }
                                    stroke={theme.palette.background.paper}
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value) => `$${value.toLocaleString()}`}
                                contentStyle={{
                                  backgroundColor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 4,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                                }}
                              />
                              <Legend 
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                iconSize={10}
                                iconType="circle"
                                formatter={(value) => <span style={{ color: theme.palette.text.primary, fontSize: '0.875rem' }}>{value}</span>}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        <Box sx={{ 
                          p: 2, 
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          backgroundColor: alpha(theme.palette.primary.main, 0.03)
                        }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Detailed Allocation
                          </Typography>
                          
                          <Box sx={{ 
                            mt: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}>
                            {assetAllocation.map((asset, index) => (
                              <Box 
                                key={`asset-${index}`}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  p: 1.2,
                                  borderRadius: 1,
                                  border: `1px solid ${alpha(
                                    asset.name === 'Stock' ? theme.palette.primary.main : 
                                    asset.name === 'ETF' ? theme.palette.secondary.main : 
                                    theme.palette.success.main, 
                                    0.3
                                  )}`,
                                  backgroundColor: alpha(
                                    asset.name === 'Stock' ? theme.palette.primary.main : 
                                    asset.name === 'ETF' ? theme.palette.secondary.main : 
                                    theme.palette.success.main,
                                    0.05
                                  )
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      bgcolor: asset.name === 'Stock' ? theme.palette.primary.main : 
                                              asset.name === 'ETF' ? theme.palette.secondary.main : 
                                              theme.palette.success.main,
                                      mr: 1
                                    }} 
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {asset.name}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ mr: 2 }}>
                                    ${asset.value.toLocaleString()}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: asset.name === 'Stock' ? theme.palette.primary.main : 
                                             asset.name === 'ETF' ? theme.palette.secondary.main : 
                                             theme.palette.success.main
                                    }}
                                  >
                                    {asset.percentage}%
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                          
                          <Box sx={{ 
                            mt: 2, 
                            pt: 1.5, 
                            borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              Allocation Summary
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {assetAllocation.map((asset, index) => (
                                <Box 
                                  key={`bar-${index}`}
                                  sx={{ mb: 0.5 }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption">{asset.name}</Typography>
                                    <Typography variant="caption">{asset.percentage}%</Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: 8,
                                      bgcolor: alpha(theme.palette.divider, 0.2),
                                      borderRadius: 4,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${asset.percentage}%`,
                                        height: '100%',
                                        bgcolor: asset.name === 'Stock' ? theme.palette.primary.main : 
                                                asset.name === 'ETF' ? theme.palette.secondary.main : 
                                                theme.palette.success.main,
                                        transition: 'width 1s ease-in-out'
                                      }}
                                    />
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              {/* Investment Simulation Chart */}
              <InvestmentSimulationChart 
                investments={getSelectedInvestmentsData()} 
                allInvestments={investments.length}
                selectedCount={selectedInvestments.length}
              />
            </>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6, 
                px: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`
              }}
            >
              <Typography variant="h6" color="info.main" gutterBottom>
                No investments added yet
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Add your first investment using the form above to start building your portfolio.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2 }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alert.severity} 
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvestmentPortfolio;
