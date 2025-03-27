import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardHeader,
  CardContent,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';

// API Base URL
const API_BASE_URL = 'http://localhost:5002';

const InvestmentSimulationChart = ({ investments = [], allInvestments = 0, selectedCount = 0 }) => {
  const theme = useTheme();
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('covid');
  const [totalAmount, setTotalAmount] = useState(0);
  const [midPointIndex, setMidPointIndex] = useState(null);
  
  // Events to simulate
  const events = [
    { value: 'covid', label: 'COVID-19 Pandemic (2020)' },
    { value: 'financial_crisis', label: 'Financial Crisis (2008)' },
    { value: 'dot_com', label: 'Dot-com Bubble (2000)' },
    { value: 'inflation', label: 'Inflation Concerns (2022)' }
  ];

  useEffect(() => {
    // Calculate total investment amount for selected investments
    if (investments && investments.length > 0) {
      const total = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [investments]);

  // Use useCallback to memoize the function to prevent infinite loops
  const fetchSimulationData = useCallback(async () => {
    if (!selectedEvent || totalAmount === 0 || !investments || investments.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const portfolioData = {
        event: selectedEvent,
        investment: totalAmount,
        holdings: investments.map(inv => ({
          symbol: inv.symbol,
          percentage: (inv.amount / totalAmount) * 100
        }))
      };

      const response = await axios.post(`${API_BASE_URL}/api/simulate-portfolio`, portfolioData);
      
      if (response.data.status === 'success') {
        setSimulationData(response.data.strategies);
        
        // Find mid-point index for reference line
        if (response.data.strategies && response.data.strategies.length > 0) {
          // Find the index where the strategies start to diverge
          for (let i = 0; i < response.data.strategies.length; i++) {
            const item = response.data.strategies[i];
            if (item.withdraw !== item.add || item.withdraw !== item.hold) {
              setMidPointIndex(i);
              break;
            }
          }
        }
      } else {
        setError('Failed to fetch simulation data');
      }
    } catch (error) {
      console.error("Simulation error:", error);
      setError(`Error: ${error.message || 'Failed to fetch simulation data'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, totalAmount, investments]);

  useEffect(() => {
    // Fetch simulation data when event changes and we have investments
    if (selectedEvent && investments && investments.length > 0) {
      fetchSimulationData();
    } else {
      // Clear simulation data if no investments are selected
      setSimulationData(null);
    }
  }, [selectedEvent, investments, fetchSimulationData]);

  // Format data for chart tooltip
  const formatTooltip = (value, name) => {
    if (name === 'Withdraw 20%' || name === 'Add 20%' || name === 'Hold') {
      return [`$${value.toLocaleString()}`, name];
    }
    return [value, name];
  };

  // Format date for X-axis
  const formatXAxis = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle event selection change
  const handleEventChange = (event) => {
    setSelectedEvent(event.target.value);
  };

  // Determine best and worst strategy
  const getBestStrategy = () => {
    if (!simulationData || simulationData.length === 0) return null;
    
    const lastDataPoint = simulationData[simulationData.length - 1];
    const withdrawValue = lastDataPoint.withdraw;
    const addValue = lastDataPoint.add;
    const holdValue = lastDataPoint.hold;
    
    if (addValue > withdrawValue && addValue > holdValue) {
      return {
        name: 'Add 20%',
        value: addValue,
        color: theme.palette.success.main
      };
    } else if (withdrawValue > addValue && withdrawValue > holdValue) {
      return {
        name: 'Withdraw 20%',
        value: withdrawValue,
        color: theme.palette.primary.main
      };
    } else {
      return {
        name: 'Hold',
        value: holdValue,
        color: theme.palette.warning.main
      };
    }
  };

  // Get event description
  const getEventDescription = () => {
    switch(selectedEvent) {
      case 'covid':
        return "The COVID-19 pandemic caused a sudden market crash followed by a relatively quick recovery, demonstrating how different investment strategies can affect portfolio performance during a health crisis.";
      case 'financial_crisis':
        return "The 2008 Financial Crisis was marked by a steep market decline and slow recovery, testing the resilience of different investment approaches during a systemic economic downturn.";
      case 'dot_com':
        return "The 2000 Dot-com Bubble burst led to significant losses in tech stocks, illustrating how market speculation and sector-specific crashes affect different investment strategies.";
      case 'inflation':
        return "The 2022 inflation concerns created market volatility as interest rates rose, showing how different strategies perform during periods of monetary policy tightening.";
      default:
        return "This simulation shows how different investment strategies would perform during a market event.";
    }
  };

  // Generate investment summary text
  const generateSummaryText = () => {
    if (!investments || investments.length === 0) return '';
    
    const date = new Date().toLocaleString();
    let text = `INVESTMENT SUMMARY - ${date}\n`;
    text += `===============================\n\n`;
    text += `TOTAL INVESTMENT AMOUNT: $${totalAmount.toLocaleString()}\n`;
    text += `NUMBER OF INVESTMENTS: ${investments.length}\n\n`;
    
    if (isFiltered) {
      text += `SELECTION: ${selectedCount} of ${allInvestments} investments (${((selectedCount / allInvestments) * 100).toFixed(0)}% of portfolio)\n\n`;
    }
    
    text += `INVESTMENT DETAILS:\n`;
    text += `---------------------------------------\n`;
    text += `SYMBOL    NAME                      TYPE     AMOUNT ($)    PERCENTAGE\n`;
    text += `---------------------------------------\n`;
    
    investments.forEach(inv => {
      const name = (inv.name || inv.symbol).padEnd(25).substring(0, 25);
      const symbol = inv.symbol.padEnd(10).substring(0, 10);
      const type = inv.assetType.padEnd(8).substring(0, 8);
      const amount = `$${parseFloat(inv.amount).toLocaleString()}`.padEnd(12);
      const percentage = `${((parseFloat(inv.amount) / totalAmount) * 100).toFixed(1)}%`;
      
      text += `${symbol}${name}${type}${amount}${percentage}\n`;
    });
    
    text += `\n---------------------------------------\n\n`;
    
    if (simulationData && simulationData.length > 0 && bestStrategy) {
      text += `SIMULATION RESULTS (${events.find(e => e.value === selectedEvent)?.label}):\n`;
      text += `---------------------------------------\n`;
      text += `BEST STRATEGY: ${bestStrategy.name}\n`;
      text += `FINAL VALUE: $${bestStrategy.value.toLocaleString()}\n\n`;
      
      const lastDataPoint = simulationData[simulationData.length - 1];
      text += `STRATEGY COMPARISON:\n`;
      text += `- Withdraw 20%: $${lastDataPoint.withdraw.toLocaleString()}\n`;
      text += `- Add 20%: $${lastDataPoint.add.toLocaleString()}\n`;
      text += `- Hold: $${lastDataPoint.hold.toLocaleString()}\n`;
    }
    
    return text;
  };

  // Copy summary to clipboard
  const copySummaryToClipboard = () => {
    const text = generateSummaryText();
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Investment summary copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
      });
  };

  // Download summary as text file
  const downloadSummaryAsText = () => {
    const text = generateSummaryText();
    const filename = `investment_summary_${new Date().toISOString().split('T')[0]}.txt`;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
  };

  const bestStrategy = getBestStrategy();
  
  // Check if we have a filtered selection
  const isFiltered = allInvestments > 0 && selectedCount < allInvestments;

  return (
    <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Investment Strategy Simulation
            </Typography>
            {isFiltered && (
              <Badge 
                badgeContent={selectedCount} 
                color="primary"
                sx={{ ml: 2 }}
              >
                <Tooltip title={`Showing simulation for ${selectedCount} selected investments`}>
                  <FilterAltIcon color="primary" />
                </Tooltip>
              </Badge>
            )}
          </Box>
        }
        subheader={
          isFiltered
            ? `Simulating performance for ${selectedCount} selected investments during market events`
            : "See how your portfolio would perform during market events under different strategies"
        }
        sx={{
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      />
      
      <CardContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {(!investments || investments.length === 0) ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No investments selected. Please check at least one investment to run the simulation.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  borderRadius: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5)
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel id="event-select-label">Market Event</InputLabel>
                  <Select
                    labelId="event-select-label"
                    value={selectedEvent}
                    label="Market Event"
                    onChange={handleEventChange}
                    disabled={loading || !investments || investments.length === 0}
                  >
                    {events.map((event) => (
                      <MenuItem key={event.value} value={event.value}>
                        {event.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  {getEventDescription()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {(!investments || investments.length === 0) ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Select investments from the table above to see simulation results.
          </Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : simulationData ? (
          <>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                background: `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Strategy Comparison: {events.find(e => e.value === selectedEvent)?.label}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.primary.main, 
                          mr: 1.5 
                        }} 
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Withdraw 20%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Selling 20% of holdings
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.success.main, 
                          mr: 1.5 
                        }} 
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Add 20%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Buying 20% more at the mid-point
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.warning.main, 
                          mr: 1.5 
                        }} 
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Hold
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Making no changes
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ height: 400, mb: 2 }}>
                {simulationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simulationData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatXAxis} 
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        domain={['dataMin - 1000', 'dataMax + 1000']}
                        stroke={theme.palette.text.secondary}
                      />
                      <RechartsTooltip 
                        formatter={formatTooltip} 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}
                      />
                      <Legend />
                      {midPointIndex !== null && simulationData[midPointIndex] && (
                        <ReferenceLine 
                          x={simulationData[midPointIndex].date} 
                          stroke={theme.palette.divider}
                          strokeDasharray="3 3"
                          label={{ 
                            value: 'Strategy Applied', 
                            position: 'insideTopRight',
                            style: { fill: theme.palette.text.secondary, fontSize: 12 }
                          }}
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="withdraw" 
                        name="Withdraw 20%" 
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 1, fill: theme.palette.primary.main }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="add" 
                        name="Add 20%" 
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, stroke: theme.palette.success.main, strokeWidth: 1, fill: theme.palette.success.main }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hold" 
                        name="Hold" 
                        stroke={theme.palette.warning.main}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, stroke: theme.palette.warning.main, strokeWidth: 1, fill: theme.palette.warning.main }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No data available for the selected event</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {bestStrategy && (
              <Box 
                sx={{ 
                  bgcolor: alpha(bestStrategy.color, 0.1), 
                  p: 2.5, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(bestStrategy.color, 0.3)}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShowChartIcon sx={{ mr: 1, color: bestStrategy.color }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Strategy Insights
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {isFiltered 
                    ? `For your selected ${investments.length} investments during this ${events.find(e => e.value === selectedEvent)?.label.toLowerCase()} scenario, the `
                    : `For this ${events.find(e => e.value === selectedEvent)?.label.toLowerCase()} scenario, the `
                  }
                  <strong style={{ color: bestStrategy.color }}>{bestStrategy.name}</strong> strategy performed best, ending with a portfolio value of <strong>${bestStrategy.value.toLocaleString()}</strong>.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEvent === 'covid' || selectedEvent === 'financial_crisis' ? 
                    "This demonstrates that market downturns can sometimes present buying opportunities for long-term investors." : 
                    "This highlights the importance of having a strategy that aligns with the specific market conditions."}
                </Typography>
              </Box>
            )}
            
            {/* Investment Performance Insights - moved here from the investment summary section */}
            {investments.length > 0 && (
              <Box 
                sx={{ 
                  mt: 3,
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9)
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Investment Performance Summary & Insights
                </Typography>
                
                {/* Selected Investment Summary - moved here */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.dark }}>
                        Selected Investment Summary
                      </Typography>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Copy summary to clipboard">
                          <IconButton 
                            size="small" 
                            onClick={copySummaryToClipboard}
                            sx={{ mr: 1 }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download as text file">
                          <IconButton 
                            size="small" 
                            onClick={downloadSummaryAsText}
                          >
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Total Amount: <strong>${totalAmount.toLocaleString()}</strong>
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {investments.length} {investments.length === 1 ? 'investment' : 'investments'} selected
                      </Typography>
                      {isFiltered && (
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                          {((selectedCount / allInvestments) * 100).toFixed(0)}% of portfolio
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Selected symbols:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {investments.map(inv => (
                          <Chip 
                            key={inv.id || inv.symbol} 
                            label={inv.symbol} 
                            size="small"
                            color={
                              inv.assetType === 'Stock' ? 'primary' : 
                              inv.assetType === 'ETF' ? 'secondary' : 'success'
                            }
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box 
                      sx={{ 
                        mt: 2,
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        pr: 1,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          borderRadius: '4px',
                        },
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ py: 1, px: 1, fontWeight: 'bold' }}>Symbol</TableCell>
                            <TableCell sx={{ py: 1, px: 1, fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ py: 1, px: 1, fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 'bold' }}>Amount ($)</TableCell>
                            <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 'bold' }}>% of Selection</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {investments.map(inv => (
                            <TableRow key={inv.id || inv.symbol}>
                              <TableCell sx={{ py: 0.5, px: 1 }}>{inv.symbol}</TableCell>
                              <TableCell sx={{ py: 0.5, px: 1 }}>{inv.name || inv.symbol}</TableCell>
                              <TableCell sx={{ py: 0.5, px: 1 }}>{inv.assetType}</TableCell>
                              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>${parseFloat(inv.amount).toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                                {((parseFloat(inv.amount) / totalAmount) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Portfolio Analysis
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        height: '100%'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'primary.main' }}>
                        Diversification Analysis
                      </Typography>
                      {investments.length <= 1 ? (
                        <Typography variant="body2" color="text.secondary">
                          Your portfolio needs more diversification. Consider adding investments across different asset types.
                        </Typography>
                      ) : investments.length <= 3 ? (
                        <Typography variant="body2" color="text.secondary">
                          You have some diversification with {investments.length} investments. Adding more variety of assets can further reduce risk.
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Good job! Your portfolio has {investments.length} investments, providing solid diversification across different assets.
                        </Typography>
                      )}
                      
                      {investments.length > 0 && Object.keys(investments.reduce((types, inv) => ({ ...types, [inv.assetType]: true }), {})).length === 1 && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'warning.main' }}>
                          Warning: All your selected investments are of the same type ({investments[0].assetType}). Consider diversifying across different asset types.
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'info.main' }}>
                        Simulation Strategy Recommendation
                      </Typography>
                      
                      {simulationData && bestStrategy ? (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Based on the {events.find(e => e.value === selectedEvent)?.label} simulation, the recommended strategy for these investments would be:
                          </Typography>
                          <Box 
                            sx={{ 
                              mt: 1, 
                              p: 1, 
                              borderRadius: 1, 
                              backgroundColor: alpha(bestStrategy.color, 0.1),
                              border: `1px solid ${alpha(bestStrategy.color, 0.3)}`,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                bgcolor: bestStrategy.color, 
                                mr: 1 
                              }} 
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                              {bestStrategy.name}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Run a simulation with a selected market event to get a strategy recommendation for these investments.
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Note: These insights are based on historical performance and selected investments. 
                    Actual market behavior may vary. Consider consulting a financial advisor.
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Select a market event to see simulation results.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentSimulationChart;
