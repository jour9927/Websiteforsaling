// 在浏览器控制台执行这个脚本来诊断报名问题
// 打开浏览器控制台: F12 或 Cmd+Option+I，然后切换到 Console 标签

// 步骤 1: 检查当前登入用户
console.log('=== 步骤 1: 检查当前用户 ===');
const { data: { user } } = await window.supabase.auth.getUser();
console.log('当前用户ID:', user?.id);
console.log('用户Email:', user?.email);

if (!user) {
  console.error('❌ 没有登入！请先登入');
  throw new Error('请先登入');
}

// 步骤 2: 检查用户的报名记录
console.log('\n=== 步骤 2: 查询报名记录 ===');
const { data: registrations, error: regError } = await window.supabase
  .from('registrations')
  .select(`
    id,
    status,
    registered_at,
    event_id,
    user_id
  `)
  .eq('user_id', user.id);

console.log('查询结果:', registrations);
console.log('查询错误:', regError);
console.log('记录数量:', registrations?.length || 0);

// 步骤 3: 检查是否有任何报名记录（不限用户）
console.log('\n=== 步骤 3: 检查所有报名记录 ===');
const { data: allRegs, error: allError, count } = await window.supabase
  .from('registrations')
  .select('*', { count: 'exact' });

console.log('总报名数量:', count);
console.log('所有报名记录:', allRegs);
console.log('查询错误:', allError);

// 步骤 4: 尝试报名一个活动（需要先找到一个活动ID）
console.log('\n=== 步骤 4: 获取可报名活动 ===');
const { data: events } = await window.supabase
  .from('events')
  .select('id, title, max_participants')
  .limit(5);

console.log('可用活动:', events);

if (events && events.length > 0) {
  const testEventId = events[0].id;
  console.log('\n=== 步骤 5: 尝试报名活动 ===');
  console.log('测试活动ID:', testEventId);
  console.log('测试活动名称:', events[0].title);
  
  // 检查是否已报名
  const { data: existing } = await window.supabase
    .from('registrations')
    .select('id')
    .eq('event_id', testEventId)
    .eq('user_id', user.id)
    .single();
  
  if (existing) {
    console.log('✅ 已经报名过这个活动:', existing);
  } else {
    console.log('准备插入报名记录...');
    const { data: newReg, error: insertError } = await window.supabase
      .from('registrations')
      .insert([{
        event_id: testEventId,
        user_id: user.id,
        status: 'pending'
      }])
      .select();
    
    console.log('插入结果:', newReg);
    console.log('插入错误:', insertError);
    
    if (insertError) {
      console.error('❌ 插入失败!');
      console.error('错误代码:', insertError.code);
      console.error('错误信息:', insertError.message);
      console.error('错误详情:', insertError.details);
      console.error('错误提示:', insertError.hint);
      
      if (insertError.code === '42501') {
        console.error('🔐 这是 RLS 权限问题！需要执行 010_fix_registrations_rls.sql');
      }
    } else {
      console.log('✅ 报名成功！');
    }
  }
}

console.log('\n=== 诊断完成 ===');
console.log('请截图上述所有输出并告诉我结果');
