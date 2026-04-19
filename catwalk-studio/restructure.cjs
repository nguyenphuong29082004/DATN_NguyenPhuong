const fs = require('fs');

let code = fs.readFileSync('src/pages/LaunchStudio/pages/BecomeModel.jsx', 'utf8');

function extractBlock(c) {
    const rx = new RegExp('// =+[\\r\\n]+[\\s\\S]*?// STEP ' + c + ':[\\s\\S]*?case ' + c + ':[\\s\\S]*?return \\(([\\s\\S]*?)\\);[\\r\\n]', 'i');
    const match = code.match(rx);
    if (!match) throw new Error('Could not find case ' + c);
    return match[1].trim();
}

try {
    const c2 = extractBlock(2);
    const c3 = extractBlock(3);
    const c4 = extractBlock(4);
    const c5 = extractBlock(5);
    const c6 = extractBlock(6);
    const c7 = extractBlock(7);

    function unwrap(jsx) {
        let start = jsx.indexOf('>') + 1;
        let end = jsx.lastIndexOf('</div>');
        return jsx.substring(start, end).trim();
    }

    const c5_inner = unwrap(c5);
    const c5_split_idx = c5_inner.indexOf('{/* Show booking rates only for real/both */}');
    const c5_target_earnings = c5_inner.substring(0, c5_split_idx).trim();
    const c5_booking_rates = c5_inner.substring(c5_split_idx).trim();

    const new_case_2 = `            // ========================================
            // STEP 2: Target Earnings
            // ========================================
            case 2:
                return (
                    <div className="step-content-wrapper">
                        ${c5_target_earnings}
                    </div>
                );`;

    const c3_inner = unwrap(c3);
    const c6_inner = unwrap(c6);
    const new_case_3 = `            // ========================================
            // STEP 3: Media & Social
            // ========================================
            case 3:
                return (
                    <div className="step-content-wrapper" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
                        ${c3_inner}
                        
                        <div style={{ width: '100%', maxWidth: '800px', margin: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
                        
                        ${c6_inner}
                    </div>
                );`;

    const c2_inner = unwrap(c2);
    const c4_inner = unwrap(c4);
    const new_case_4 = `            // ========================================
            // STEP 4: Profile & Preferences
            // ========================================
            case 4:
                return (
                    <div className="step-content-wrapper">
                        ${c2_inner}
                        
                        ${c5_booking_rates}

                        <div style={{ width: '100%', margin: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
                        
                        ${c4_inner}
                    </div>
                );`;

    const new_case_5 = `            // ========================================
            // STEP 5: Elite & Launch
            // ========================================
            case 5:
                return (
                    ${c7}
                );`;

    const s2_index = code.indexOf('// STEP 2: Profile Creation');
    const s8_index = code.indexOf('// STEP 8: Success');
    
    const old_switch_start = code.lastIndexOf('// ========================================', s2_index);
    const old_switch_end = code.lastIndexOf('// ========================================', s8_index);

    const new_render_steps = new_case_2 + '\n\n' + new_case_3 + '\n\n' + new_case_4 + '\n\n' + new_case_5 + '\n\n            ';

    code = code.substring(0, old_switch_start) + new_render_steps + code.substring(old_switch_end).replace('// STEP 8: Success', '// STEP 6: Success');

    fs.writeFileSync('src/pages/LaunchStudio/pages/BecomeModel.jsx', code, 'utf8');
    console.log('Successfully restructured steps.');
} catch (err) {
    console.error(err);
}
