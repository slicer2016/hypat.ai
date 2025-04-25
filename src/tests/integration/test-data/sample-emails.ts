/**
 * Sample Emails for Integration Testing
 * 
 * This file contains a collection of sample email data for testing purposes.
 * Includes various types of emails (newsletters, regular emails, etc.) with
 * different characteristics to test detection and processing.
 */

import { Email } from '../../../interfaces/gmail-mcp.js';
import { Buffer } from 'buffer';

/**
 * Generate sample email data for testing
 */
export const sampleEmails: Email[] = [
  // A clear newsletter example
  {
    id: 'newsletter-sample-1',
    threadId: 'thread-1',
    labelIds: ['INBOX', 'CATEGORY_UPDATES'],
    internalDate: '2023-05-10T15:30:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Tech Weekly <newsletter@techweekly.com>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'This Week in Technology - Issue #42' },
        { name: 'Date', value: 'Wed, 10 May 2023 15:30:00 +0000' },
        { name: 'List-Unsubscribe', value: '<https://techweekly.com/unsubscribe>' },
        { name: 'Precedence', value: 'bulk' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body>
              <div style="max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px;">
                  <h1>Tech Weekly</h1>
                  <h2>Issue #42 - May 10, 2023</h2>
                </div>
                
                <div>
                  <h3>Top Stories This Week</h3>
                  <ul>
                    <li>
                      <a href="https://example.com/article1">New AI Breakthrough Shows Promise for Natural Language Processing</a>
                      <p>Researchers at OpenAI have developed a new model that achieves state-of-the-art results on multiple NLP benchmarks.</p>
                    </li>
                    <li>
                      <a href="https://example.com/article2">The Future of Remote Work: Trends to Watch</a>
                      <p>As companies adapt to hybrid work models, new technologies are emerging to bridge the gap between in-office and remote workers.</p>
                    </li>
                    <li>
                      <a href="https://example.com/article3">Quantum Computing Takes Another Leap Forward</a>
                      <p>IBM announces new 127-qubit processor, marking significant progress in the race for quantum advantage.</p>
                    </li>
                  </ul>
                </div>
                
                <div style="margin-top: 30px;">
                  <h3>Industry Updates</h3>
                  <p>Microsoft has announced its newest Surface devices, featuring improved performance and battery life.</p>
                  <p>Google I/O conference is scheduled for next week with expected announcements in AI and Android developments.</p>
                </div>
                
                <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;">
                  <p>You received this because you subscribed to Tech Weekly. <a href="https://techweekly.com/unsubscribe">Unsubscribe</a> | <a href="https://techweekly.com/preferences">Update preferences</a></p>
                </div>
              </div>
            </body>
          </html>
        `).toString('base64')
      }
    }
  },
  
  // A finance newsletter
  {
    id: 'newsletter-sample-2',
    threadId: 'thread-2',
    labelIds: ['INBOX', 'CATEGORY_PROMOTIONS'],
    internalDate: '2023-05-12T08:15:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Financial Insights <daily@financialinsights.com>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Daily Market Update - May 12' },
        { name: 'Date', value: 'Fri, 12 May 2023 08:15:00 +0000' },
        { name: 'List-Unsubscribe', value: '<mailto:unsubscribe@financialinsights.com>' },
        { name: 'X-Newsletter-ID', value: 'financial-daily-23051201' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body style="font-family: Arial, sans-serif;">
              <table width="600" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background-color: #1E3A8A; padding: 20px; text-align: center; color: white;">
                    <h1>Financial Insights</h1>
                    <h3>Daily Market Update - May 12, 2023</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <h2>Market Summary</h2>
                    <p>The S&P 500 rose 1.2% yesterday, recovering from earlier losses as inflation data came in lower than expected.</p>
                    <ul>
                      <li>S&P 500: +1.2%</li>
                      <li>Nasdaq: +1.8%</li>
                      <li>Dow Jones: +0.7%</li>
                      <li>10-Year Treasury: 3.45% (-0.05)</li>
                    </ul>
                    
                    <h2>Top Stories</h2>
                    <h3>Federal Reserve Signals Potential Pause in Rate Hikes</h3>
                    <p>Fed officials have begun discussing a potential pause in interest rate increases, citing progress in the fight against inflation.</p>
                    <p><a href="https://example.com/fed-pause">Read more</a></p>
                    
                    <h3>Tech Sector Leads Market Rally</h3>
                    <p>Technology stocks led yesterday's market gains, with semiconductor companies showing particularly strong performance.</p>
                    <p><a href="https://example.com/tech-rally">Read more</a></p>
                    
                    <h3>Oil Prices Stabilize After Recent Declines</h3>
                    <p>Crude oil prices stabilized around $75 per barrel following a week of volatility in energy markets.</p>
                    <p><a href="https://example.com/oil-markets">Read more</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px;">
                    <p>This email was sent to user@example.com because you subscribed to our daily market updates.</p>
                    <p><a href="https://financialinsights.com/unsubscribe">Unsubscribe</a> | <a href="https://financialinsights.com/preferences">Manage Preferences</a></p>
                    <p>Financial Insights Inc., 123 Wall Street, New York, NY 10005</p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `).toString('base64')
      }
    }
  },
  
  // A product newsletter
  {
    id: 'newsletter-sample-3',
    threadId: 'thread-3',
    labelIds: ['INBOX', 'CATEGORY_PROMOTIONS'],
    internalDate: '2023-05-14T12:45:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Design Weekly <newsletter@designweekly.co>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Design Inspiration for Your Next Project' },
        { name: 'Date', value: 'Sun, 14 May 2023 12:45:00 +0000' },
        { name: 'List-Unsubscribe', value: '<https://designweekly.co/unsubscribe>' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="padding: 30px; text-align: center; background-color: #FF5A5F;">
                  <h1 style="color: white; margin: 0;">Design Weekly</h1>
                  <p style="color: white; margin-top: 10px;">Inspiration for creative professionals</p>
                </div>
                
                <div style="padding: 30px;">
                  <h2>This Week's Highlights</h2>
                  
                  <div style="margin-bottom: 30px;">
                    <img src="https://example.com/images/design1.jpg" alt="Minimalist poster design" style="width: 100%; height: auto; margin-bottom: 15px;">
                    <h3>The Return of Minimalism in Brand Design</h3>
                    <p>Major brands are embracing simpler, more streamlined visual identities. We explore this trend and what it means for designers.</p>
                    <a href="https://example.com/minimalism-trend" style="color: #FF5A5F; text-decoration: none;">Read Article →</a>
                  </div>
                  
                  <div style="margin-bottom: 30px;">
                    <h3>New Tools We're Loving</h3>
                    <ul>
                      <li><strong>Figma's New Features:</strong> The latest update includes improved auto layout and variable fonts support.</li>
                      <li><strong>Spline:</strong> Create and publish 3D web experiences without coding.</li>
                      <li><strong>ColorSpace:</strong> Generate beautiful color palettes with AI assistance.</li>
                    </ul>
                    <a href="https://example.com/design-tools" style="color: #FF5A5F; text-decoration: none;">Explore All Tools →</a>
                  </div>
                  
                  <div>
                    <h3>Upcoming Design Events</h3>
                    <p><strong>May 20-22:</strong> UX London Conference</p>
                    <p><strong>May 25:</strong> Webinar: Designing for Accessibility</p>
                    <p><strong>June 5-7:</strong> OFFF Barcelona</p>
                    <a href="https://example.com/events" style="color: #FF5A5F; text-decoration: none;">View All Events →</a>
                  </div>
                </div>
                
                <div style="padding: 20px; background-color: #f8f8f8; text-align: center; font-size: 12px; color: #666;">
                  <p>You're receiving this email because you signed up for Design Weekly newsletter.</p>
                  <p><a href="https://designweekly.co/unsubscribe" style="color: #666;">Unsubscribe</a> | <a href="https://designweekly.co/preferences" style="color: #666;">Manage Preferences</a></p>
                  <p>Design Weekly, 123 Creative St., San Francisco, CA 94103</p>
                </div>
              </div>
            </body>
          </html>
        `).toString('base64')
      }
    }
  },
  
  // A regular personal email (not a newsletter)
  {
    id: 'regular-email-sample-1',
    threadId: 'thread-4',
    labelIds: ['INBOX'],
    internalDate: '2023-05-15T09:22:00Z',
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: 'John Smith <john.smith@example.com>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Meeting tomorrow?' },
        { name: 'Date', value: 'Mon, 15 May 2023 09:22:00 +0000' }
      ],
      body: {
        data: Buffer.from(`
          Hi there,
          
          I was wondering if you're available for a quick meeting tomorrow at 2pm to discuss the project progress.
          
          Let me know what works for you.
          
          Best regards,
          John
        `).toString('base64')
      }
    }
  },
  
  // An update email (borderline newsletter - could be mistaken for one)
  {
    id: 'ambiguous-email-sample-1',
    threadId: 'thread-5',
    labelIds: ['INBOX', 'CATEGORY_UPDATES'],
    internalDate: '2023-05-13T16:05:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Project Updates <updates@projectmanager.com>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Your project "Website Redesign" has new activity' },
        { name: 'Date', value: 'Sat, 13 May 2023 16:05:00 +0000' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                <div style="background-color: #0066cc; padding: 15px; text-align: center;">
                  <h2 style="color: white; margin: 0;">Project Update</h2>
                </div>
                
                <div style="padding: 20px; background-color: white;">
                  <h3>Your project "Website Redesign" has new activity</h3>
                  
                  <p>There have been several updates to your project:</p>
                  
                  <ul>
                    <li>3 tasks have been completed</li>
                    <li>2 new comments were added</li>
                    <li>The deadline for milestone "Design Approval" is approaching (May 20)</li>
                  </ul>
                  
                  <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
                    <p><strong>Mark's comment on "Homepage Wireframes":</strong></p>
                    <p>"The latest iteration looks great! I think we should proceed with this direction."</p>
                  </div>
                  
                  <p>View all updates and respond by clicking the button below:</p>
                  
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="https://projectmanager.com/projects/123" style="background-color: #0066cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;">View Project</a>
                  </div>
                </div>
                
                <div style="padding: 15px; text-align: center; font-size: 12px; color: #666;">
                  <p>This is an automatic notification from Project Manager.</p>
                  <p>To adjust your notification settings, <a href="https://projectmanager.com/settings/notifications" style="color: #0066cc;">click here</a>.</p>
                </div>
              </div>
            </body>
          </html>
        `).toString('base64')
      }
    }
  },
  
  // A transactional email (not a newsletter)
  {
    id: 'transactional-email-sample-1',
    threadId: 'thread-6',
    labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
    internalDate: '2023-05-15T11:30:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Online Store <orders@onlinestore.com>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Your Order Confirmation #12345' },
        { name: 'Date', value: 'Mon, 15 May 2023 11:30:00 +0000' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee;">
                  <h1 style="color: #333333;">Order Confirmation</h1>
                </div>
                
                <div style="padding: 20px 0;">
                  <p>Dear Customer,</p>
                  <p>Thank you for your order! We're processing it now and will ship it soon.</p>
                  
                  <div style="background-color: #f8f8f8; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Summary</h3>
                    <p><strong>Order Number:</strong> #12345</p>
                    <p><strong>Order Date:</strong> May 15, 2023</p>
                    <p><strong>Payment Method:</strong> Credit Card (ending in 1234)</p>
                    <p><strong>Shipping Address:</strong><br>
                    123 Main Street<br>
                    Apt 4B<br>
                    New York, NY 10001</p>
                  </div>
                  
                  <h3>Ordered Items</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f8f8f8;">
                      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dddddd;">Item</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #dddddd;">Quantity</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 1px solid #dddddd;">Price</th>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #dddddd;">Wireless Headphones</td>
                      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dddddd;">1</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dddddd;">$79.99</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #dddddd;">USB-C Charging Cable</td>
                      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dddddd;">2</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dddddd;">$19.98</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right;"><strong>Subtotal</strong></td>
                      <td style="padding: 10px; text-align: right;">$99.97</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right;"><strong>Shipping</strong></td>
                      <td style="padding: 10px; text-align: right;">$5.99</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right;"><strong>Tax</strong></td>
                      <td style="padding: 10px; text-align: right;">$10.59</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total</strong></td>
                      <td style="padding: 10px; text-align: right; font-weight: bold;">$116.55</td>
                    </tr>
                  </table>
                  
                  <div style="margin-top: 30px;">
                    <p>You can track your order status by clicking the button below:</p>
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="https://onlinestore.com/orders/12345" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;">Track Order</a>
                    </div>
                  </div>
                </div>
                
                <div style="padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #777777;">
                  <p>If you have any questions about your order, please contact our customer service team at support@onlinestore.com.</p>
                  <p>Online Store, Inc. | 100 Commerce Blvd, Boston, MA 02110</p>
                </div>
              </div>
            </body>
          </html>
        `).toString('base64')
      }
    }
  },
  
  // A science newsletter
  {
    id: 'newsletter-sample-4',
    threadId: 'thread-7',
    labelIds: ['INBOX', 'CATEGORY_UPDATES'],
    internalDate: '2023-05-09T18:20:00Z',
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'Science Updates <newsletter@scienceupdates.org>' },
        { name: 'To', value: 'user@example.com' },
        { name: 'Subject', value: 'Latest Discoveries in Astronomy and Physics' },
        { name: 'Date', value: 'Tue, 09 May 2023 18:20:00 +0000' },
        { name: 'List-Unsubscribe', value: '<https://scienceupdates.org/unsubscribe>' },
        { name: 'X-Mailer', value: 'Newsletter-System-3.2' }
      ],
      body: {
        data: Buffer.from(`
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="padding: 20px; text-align: center; background-color: #003366;">
                  <h1 style="color: white; margin: 0;">Science Updates</h1>
                  <p style="color: white; margin-top: 10px;">Weekly digest of scientific discoveries</p>
                </div>
                
                <div style="padding: 20px;">
                  <h2>Latest in Astronomy</h2>
                  
                  <div style="margin-bottom: 25px;">
                    <h3>New Exoplanet Discovery Could Hold Keys to Finding Habitable Worlds</h3>
                    <p>Astronomers using the James Webb Space Telescope have identified a potentially habitable exoplanet around a nearby star system. The planet, named TOI-1452 b, shows evidence of a substantial water atmosphere and is located in the habitable zone of its star.</p>
                    <a href="https://example.com/exoplanet-discovery" style="color: #003366;">Read more</a>
                  </div>
                  
                  <div style="margin-bottom: 25px;">
                    <h3>Black Hole Merger Creates Unexpected Radio Burst</h3>
                    <p>Scientists have detected an unusual radio signal that appears to be associated with the merger of two supermassive black holes. This discovery challenges current models of black hole physics.</p>
                    <a href="https://example.com/black-hole-merger" style="color: #003366;">Read more</a>
                  </div>
                  
                  <h2>Physics Breakthroughs</h2>
                  
                  <div style="margin-bottom: 25px;">
                    <h3>Quantum Entanglement Maintained Over Record Distance</h3>
                    <p>Researchers have successfully maintained quantum entanglement between particles separated by over 100 kilometers, setting a new record and bringing quantum networking closer to practical reality.</p>
                    <a href="https://example.com/quantum-entanglement" style="color: #003366;">Read more</a>
                  </div>
                  
                  <div>
                    <h3>New State of Matter Observed in Lab Conditions</h3>
                    <p>Physicists report the observation of a new state of matter that exhibits properties of both solid and superfluid phases simultaneously. This discovery could lead to new materials with unique properties.</p>
                    <a href="https://example.com/new-state-matter" style="color: #003366;">Read more</a>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                    <h2>Upcoming Scientific Events</h2>
                    <ul>
                      <li><strong>May 18:</strong> International Astronomy Symposium (Virtual)</li>
                      <li><strong>May 22-24:</strong> Quantum Computing Conference, Boston</li>
                      <li><strong>June 5:</strong> Total Solar Eclipse Viewing (Live Stream)</li>
                    </ul>
                  </div>
                </div>
                
                <div style="padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 12px;">
                  <p>You're receiving this email because you subscribed to Science Updates.</p>
                  <p><a href="https://scienceupdates.org/unsubscribe" style="color: #003366;">Unsubscribe</a> | <a href="https://scienceupdates.org/preferences" style="color: #003366;">Manage Preferences</a></p>
                  <p>Science Updates Foundation, 234 Research Blvd., Cambridge, MA 02142</p>
                </div>
              </div>
            </body>
          </html>
        `).toString('base64')
      }
    }
  }
];

/**
 * Get all sample emails as an array
 */
export function getSampleEmails(): Email[] {
  return [...sampleEmails];
}

/**
 * Get a specific sample email by ID
 * @param id The email ID
 */
export function getSampleEmailById(id: string): Email | undefined {
  return sampleEmails.find(email => email.id === id);
}

/**
 * Get all newsletter emails (emails that should be detected as newsletters)
 */
export function getNewsletterEmails(): Email[] {
  return sampleEmails.filter(email => 
    email.id.startsWith('newsletter-sample-')
  );
}

/**
 * Get non-newsletter emails (emails that should not be detected as newsletters)
 */
export function getNonNewsletterEmails(): Email[] {
  return sampleEmails.filter(email => 
    !email.id.startsWith('newsletter-sample-')
  );
}

/**
 * Get ambiguous emails (borderline case that might be newsletters)
 */
export function getAmbiguousEmails(): Email[] {
  return sampleEmails.filter(email => 
    email.id.startsWith('ambiguous-email-sample-')
  );
}