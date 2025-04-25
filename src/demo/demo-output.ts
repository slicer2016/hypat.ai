/**
 * Demo Output Utilities
 * Provides formatting and visualization tools for the demo
 */

import { Logger } from '../utils/logger.js';

// ANSI color codes for terminal output
const Colors = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  UNDERSCORE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  
  FG: {
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    GRAY: '\x1b[90m',
  },
  
  BG: {
    BLACK: '\x1b[40m',
    RED: '\x1b[41m',
    GREEN: '\x1b[42m',
    YELLOW: '\x1b[43m',
    BLUE: '\x1b[44m',
    MAGENTA: '\x1b[45m',
    CYAN: '\x1b[46m',
    WHITE: '\x1b[47m',
    GRAY: '\x1b[100m',
  }
};

// Interface for demo sections
interface Section {
  title: string;
  description?: string;
}

// Interface for demo steps
interface Step {
  title: string;
  description?: string;
}

/**
 * Demo output utility class
 */
export class DemoOutput {
  private logger: Logger;
  private currentSectionIndex: number = 0;
  private currentStepIndex: number = 0;
  private sections: Section[] = [];
  private steps: Step[] = [];
  private colorEnabled: boolean = true;
  private logPrefix: string = 'Demo';
  
  constructor(options?: { colorEnabled?: boolean, logPrefix?: string }) {
    this.logger = new Logger(options?.logPrefix || 'Demo');
    this.colorEnabled = options?.colorEnabled !== undefined ? options.colorEnabled : true;
    this.logPrefix = options?.logPrefix || 'Demo';
  }
  
  /**
   * Start the demo
   * @param title The demo title
   * @param description Optional demo description
   */
  startDemo(title: string, description?: string): void {
    this.printLine();
    this.printCentered(`${Colors.BRIGHT}${Colors.FG.CYAN}HYPAT.AI DEMO: ${title}${Colors.RESET}`);
    
    if (description) {
      this.printCentered(description);
    }
    
    this.printLine();
    console.log('\n');
  }
  
  /**
   * End the demo
   * @param message The final message to display
   */
  endDemo(message: string = 'Demo completed successfully.'): void {
    console.log('\n');
    this.printLine();
    this.printCentered(`${Colors.BRIGHT}${Colors.FG.GREEN}${message}${Colors.RESET}`);
    this.printLine();
  }
  
  /**
   * Set up demo sections
   * @param sections The sections to set up
   */
  setSections(sections: Section[]): void {
    this.sections = sections;
    this.currentSectionIndex = 0;
  }
  
  /**
   * Start a demo section
   * @param index The section index to start
   */
  startSection(index: number): void {
    if (index < 0 || index >= this.sections.length) {
      this.logger.warn(`Invalid section index: ${index}`);
      return;
    }
    
    this.currentSectionIndex = index;
    const section = this.sections[index];
    
    console.log('\n');
    this.printSectionHeader(index + 1, section.title);
    
    if (section.description) {
      console.log(`${Colors.FG.GRAY}${section.description}${Colors.RESET}`);
    }
    
    console.log('\n');
  }
  
  /**
   * Start the next section
   */
  nextSection(): void {
    this.startSection(this.currentSectionIndex + 1);
  }
  
  /**
   * Set up steps for current section
   * @param steps The steps to set up
   */
  setSteps(steps: Step[]): void {
    this.steps = steps;
    this.currentStepIndex = 0;
  }
  
  /**
   * Start a step in the current section
   * @param index The step index to start
   */
  startStep(index: number): void {
    if (index < 0 || index >= this.steps.length) {
      this.logger.warn(`Invalid step index: ${index}`);
      return;
    }
    
    this.currentStepIndex = index;
    const step = this.steps[index];
    
    console.log('\n');
    this.printStepHeader(index + 1, step.title);
    
    if (step.description) {
      console.log(`${Colors.FG.GRAY}${step.description}${Colors.RESET}`);
    }
    
    console.log('');
  }
  
  /**
   * Start the next step
   */
  nextStep(): void {
    this.startStep(this.currentStepIndex + 1);
  }
  
  /**
   * Print a section header
   * @param number The section number
   * @param title The section title
   */
  printSectionHeader(number: number, title: string): void {
    const formattedNumber = String(number).padStart(2, '0');
    console.log(`${Colors.BRIGHT}${Colors.FG.CYAN}SECTION ${formattedNumber}: ${title}${Colors.RESET}`);
    this.printLine('-');
  }
  
  /**
   * Print a step header
   * @param number The step number
   * @param title The step title
   */
  printStepHeader(number: number, title: string): void {
    const formattedNumber = String(number).padStart(2, '0');
    console.log(`${Colors.BRIGHT}${Colors.FG.YELLOW}STEP ${formattedNumber}: ${title}${Colors.RESET}`);
  }
  
  /**
   * Print a horizontal line
   * @param char The character to use for the line
   */
  printLine(char: string = '='): void {
    const width = process.stdout.columns || 80;
    console.log(char.repeat(width));
  }
  
  /**
   * Print centered text
   * @param text The text to center
   */
  printCentered(text: string): void {
    const width = process.stdout.columns || 80;
    const textLength = this.stripAnsi(text).length;
    const padding = Math.max(0, Math.floor((width - textLength) / 2));
    console.log(' '.repeat(padding) + text);
  }
  
  /**
   * Print a heading
   * @param heading The heading text
   * @param level The heading level (1-3)
   */
  printHeading(heading: string, level: 1 | 2 | 3 = 1): void {
    switch (level) {
      case 1:
        console.log(`\n${Colors.BRIGHT}${Colors.FG.MAGENTA}${heading}${Colors.RESET}`);
        break;
      case 2:
        console.log(`\n${Colors.BRIGHT}${Colors.FG.BLUE}${heading}${Colors.RESET}`);
        break;
      case 3:
        console.log(`\n${Colors.BRIGHT}${Colors.FG.CYAN}${heading}${Colors.RESET}`);
        break;
    }
  }
  
  /**
   * Print a key-value pair
   * @param key The key
   * @param value The value
   * @param indent The indentation level
   */
  printKeyValue(key: string, value: any, indent: number = 0): void {
    const indentation = ' '.repeat(indent * 2);
    console.log(`${indentation}${Colors.BRIGHT}${key}:${Colors.RESET} ${value}`);
  }
  
  /**
   * Print an object
   * @param obj The object to print
   * @param indent The indentation level
   * @param includeEmpty Whether to include empty values
   */
  printObject(obj: Record<string, any>, indent: number = 0, includeEmpty: boolean = false): void {
    const indentation = ' '.repeat(indent * 2);
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip empty values if includeEmpty is false
      if (!includeEmpty && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Format the value
      let formattedValue = value;
      
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            if (includeEmpty) {
              console.log(`${indentation}${Colors.BRIGHT}${key}:${Colors.RESET} []`);
            }
          } else {
            console.log(`${indentation}${Colors.BRIGHT}${key}:${Colors.RESET}`);
            for (const item of value) {
              if (typeof item === 'object' && item !== null) {
                console.log(`${indentation}  - `);
                this.printObject(item, indent + 2, includeEmpty);
              } else {
                console.log(`${indentation}  - ${item}`);
              }
            }
          }
          continue;
        } else if (value instanceof Date) {
          formattedValue = value.toISOString();
        } else {
          console.log(`${indentation}${Colors.BRIGHT}${key}:${Colors.RESET}`);
          this.printObject(value, indent + 1, includeEmpty);
          continue;
        }
      }
      
      console.log(`${indentation}${Colors.BRIGHT}${key}:${Colors.RESET} ${formattedValue}`);
    }
  }
  
  /**
   * Print a table of objects
   * @param objects The array of objects to print as a table
   * @param columns The columns to include and their headers
   */
  printTable(objects: any[], columns: { key: string, header: string, width?: number }[]): void {
    if (objects.length === 0) {
      console.log(`${Colors.FG.GRAY}(No data)${Colors.RESET}`);
      return;
    }
    
    // Determine column widths
    const columnWidths = columns.map(col => {
      if (col.width) return col.width;
      
      // Find the max width needed for this column
      const headerWidth = col.header.length;
      let maxDataWidth = 0;
      
      for (const obj of objects) {
        const value = obj[col.key];
        const strValue = value !== undefined && value !== null ? String(value) : '';
        maxDataWidth = Math.max(maxDataWidth, strValue.length);
      }
      
      return Math.max(headerWidth, maxDataWidth, 5); // Minimum width of 5
    });
    
    // Print header
    let header = '';
    let separator = '';
    
    for (let i = 0; i < columns.length; i++) {
      const colWidth = columnWidths[i];
      header += `${Colors.BRIGHT}${columns[i].header.padEnd(colWidth)}${Colors.RESET} | `;
      separator += '-'.repeat(colWidth) + '-+-';
    }
    
    console.log(header);
    console.log(separator);
    
    // Print rows
    for (const obj of objects) {
      let row = '';
      
      for (let i = 0; i < columns.length; i++) {
        const colWidth = columnWidths[i];
        const value = obj[columns[i].key];
        const strValue = value !== undefined && value !== null ? String(value) : '';
        row += strValue.padEnd(colWidth) + ' | ';
      }
      
      console.log(row);
    }
  }
  
  /**
   * Print a success message
   * @param message The message to print
   */
  printSuccess(message: string): void {
    console.log(`${Colors.FG.GREEN}✓ ${message}${Colors.RESET}`);
  }
  
  /**
   * Print an error message
   * @param message The message to print
   */
  printError(message: string): void {
    console.log(`${Colors.FG.RED}✗ ${message}${Colors.RESET}`);
  }
  
  /**
   * Print a warning message
   * @param message The message to print
   */
  printWarning(message: string): void {
    console.log(`${Colors.FG.YELLOW}⚠ ${message}${Colors.RESET}`);
  }
  
  /**
   * Print an info message
   * @param message The message to print
   */
  printInfo(message: string): void {
    console.log(`${Colors.FG.BLUE}ℹ ${message}${Colors.RESET}`);
  }
  
  /**
   * Print a loading message
   * @param message The message to print
   */
  printLoading(message: string): void {
    console.log(`${Colors.FG.CYAN}⟳ ${message}${Colors.RESET}`);
  }
  
  /**
   * Print a comparison of before and after values
   * @param title The title of the comparison
   * @param before The before value
   * @param after The after value
   * @param improved Whether the change is an improvement
   */
  printComparison(title: string, before: any, after: any, improved: boolean = true): void {
    const changeIcon = improved ? '↑' : '↓';
    const changeColor = improved ? Colors.FG.GREEN : Colors.FG.RED;
    
    console.log(`${Colors.BRIGHT}${title}:${Colors.RESET}`);
    console.log(`  Before: ${before}`);
    console.log(`  After:  ${after} ${changeColor}${changeIcon}${Colors.RESET}`);
  }
  
  /**
   * Print a progress bar
   * @param current The current value
   * @param total The total value
   * @param width The width of the progress bar
   */
  printProgressBar(current: number, total: number, width: number = 40): void {
    const progress = Math.min(1, current / total);
    const filledWidth = Math.round(width * progress);
    const emptyWidth = width - filledWidth;
    
    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
    const percentage = Math.round(progress * 100);
    
    let color = Colors.FG.RED;
    if (percentage > 75) color = Colors.FG.GREEN;
    else if (percentage > 50) color = Colors.FG.YELLOW;
    else if (percentage > 25) color = Colors.FG.BLUE;
    
    console.log(`${color}[${bar}] ${percentage}%${Colors.RESET}`);
  }
  
  /**
   * Print a code block
   * @param code The code to print
   * @param language The language of the code
   */
  printCodeBlock(code: string, language: string = ''): void {
    console.log(`${Colors.FG.GRAY}```${language}`);
    console.log(code);
    console.log(````${Colors.RESET}`);
  }
  
  /**
   * Print a wait message and wait for the specified time
   * @param message The message to print
   * @param seconds The number of seconds to wait
   */
  async wait(message: string, seconds: number): Promise<void> {
    console.log(`${Colors.FG.CYAN}⟳ ${message} (waiting ${seconds} seconds)${Colors.RESET}`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
  
  /**
   * Wait for a key press
   * @param message The message to display
   */
  async waitForKeyPress(message: string = 'Press any key to continue...'): Promise<void> {
    return new Promise(resolve => {
      console.log(`\n${Colors.FG.CYAN}${message}${Colors.RESET}`);
      
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        console.log('');
        resolve();
      });
    });
  }
  
  /**
   * Strip ANSI color codes from a string
   * @param str The string to strip ANSI codes from
   */
  private stripAnsi(str: string): string {
    return str.replace(/\x1B\[\d+m/g, '');
  }
}