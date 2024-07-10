import { Chart, StepLineSeries } from '@syncfusion/ej2-charts';
import { numData } from './datasource.ts';
Chart.Inject(StepLineSeries);

let chart: Chart = new Chart({
    series:[{
        dataSource: numData,
        xName: 'x', yName: 'y',
        // Series type as StepLine
        type: 'StepLine'
    }],
}, '#element');