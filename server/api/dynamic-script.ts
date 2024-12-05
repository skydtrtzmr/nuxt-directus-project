let userIndex = 0; // 计数器

export default defineEventHandler((event) => {
//     const script = `
//     console.log("Executing script for user: ${user.username}");
//     document.querySelector('#username').value = '${user.username}';
//     document.querySelector('#password').value = '${user.password}';
//     document.querySelector('#login-form').submit();
//   `;
    return `您是第 ${++userIndex} 位访客`
});
