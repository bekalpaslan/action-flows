/**
 * SwimlaneBackground - Custom ReactFlow background with swimlane dividers
 * Displays horizontal lanes with action type labels
 */

export interface SwimlaneBackgroundProps {
  swimlaneNames: string[];
  swimlaneHeight?: number;
}

export const SwimlaneBackground: React.FC<SwimlaneBackgroundProps> = ({
  swimlaneNames,
  swimlaneHeight = 180,
}) => {

  return (
    <div className="swimlane-background">
      {swimlaneNames.map((name, index) => {
        const yPos = index * swimlaneHeight;

        return (
          <div
            key={name}
            className="swimlane"
            style={{
              position: 'absolute',
              top: yPos,
              left: 0,
              right: 0,
              height: swimlaneHeight,
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: index % 2 === 0 ? '#fafafa' : '#f5f5f5',
              pointerEvents: 'none',
            }}
          >
            <div
              className="swimlane-label"
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                padding: '4px 12px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#666',
                textTransform: 'capitalize',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
