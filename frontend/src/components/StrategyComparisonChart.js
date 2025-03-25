import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { format, parseISO } from 'date-fns';

const StrategyComparisonChart = ({ strategiesData, summary }) => {
  if (!strategiesData || Object.keys(strategiesData).length === 0) {
    return <div>No strategy data available</div>;
  }

  // Format the date for display in tooltip
  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  // Prepare data for the chart - need to combine all strategies
  const chartData = strategiesData.hold.map((item, index) => {
    return {
      date: item.date,
      hold: item.portfolio_value,
      withdraw: strategiesData.withdraw[index].portfolio_value,
      add: strategiesData.add[index].portfolio_value
    };
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}>
          <p style={{ margin: 0 }}><strong>{formatDate(label)}</strong></p>
          <p style={{ margin: 0, color: '#3498db' }}>
            Hold: ${payload[0].value.toFixed(2)}
          </p>
          <p style={{ margin: 0, color: '#e74c3c' }}>
            Withdraw 20%: ${payload[1].value.toFixed(2)}
          </p>
          <p style={{ margin: 0, color: '#2ecc71' }}>
            Add 20%: ${payload[2].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="strategy-summary">
        <h3>Investment Strategy Comparison</h3>
        {summary && (
          <div className="strategy-results">
            <p>
              <strong>Event:</strong> {summary.eventName} ({summary.eventDate}) - Severity: {summary.eventSeverity}
            </p>
            <div className="strategy-cards">
              <div className="strategy-card">
                <h4>Hold Strategy</h4>
                <p className="value">${summary.finalValues.hold.toFixed(2)}</p>
                <p className="change" style={{ color: summary.percentChanges.hold >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  {summary.percentChanges.hold >= 0 ? '+' : ''}{summary.percentChanges.hold}%
                </p>
              </div>
              <div className="strategy-card">
                <h4>Withdraw 20%</h4>
                <p className="value">${summary.finalValues.withdraw.toFixed(2)}</p>
                <p className="change" style={{ color: summary.percentChanges.withdraw >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  {summary.percentChanges.withdraw >= 0 ? '+' : ''}{summary.percentChanges.withdraw}%
                </p>
              </div>
              <div className="strategy-card">
                <h4>Add 20%</h4>
                <p className="value">${summary.finalValues.add.toFixed(2)}</p>
                <p className="change" style={{ color: summary.percentChanges.add >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  {summary.percentChanges.add >= 0 ? '+' : ''}{summary.percentChanges.add}%
                </p>
              </div>
            </div>
            <p className="best-strategy">
              <strong>Best Strategy:</strong> {summary.bestStrategy === 'hold' ? 'Hold' : 
                summary.bestStrategy === 'withdraw' ? 'Withdraw 20%' : 'Add 20%'}
            </p>
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => {
              try {
                return format(parseISO(tick), 'MMM yyyy');
              } catch (error) {
                return tick;
              }
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(tick) => `$${tick}`}
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line 
            type="monotone" 
            dataKey="hold" 
            name="Hold"
            stroke="#3498db" 
            dot={false}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="withdraw" 
            name="Withdraw 20%"
            stroke="#e74c3c" 
            dot={false}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="add" 
            name="Add 20%"
            stroke="#2ecc71" 
            dot={false}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StrategyComparisonChart;
