'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SecureLS from 'secure-ls';
export function useAccessCheck(pageId) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessLevel, setAccessLevel] = useState(null);

    useEffect(() => {
        const verifyAccess = async () => {
            if (!pageId) {
                console.error("Page ID is required for useAccessCheck hook.");
                setIsLoading(false);
                return;
            }

            let employeeId = '';
            try {
                const ls = new SecureLS({ encodingType: "aes" });
                employeeId = ls.get("employee_id");
                if (!employeeId) {
                    throw new Error("Employee ID not found.");
                }
            } catch (error) {
                console.warn(error.message, "Redirecting to login.");
                window.location.href = '/';
                return;
            }

            try {
                const response = await fetch(`/api/access/user-access`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ empId: employeeId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user access data.');
                }
                
                const accessData = await response.json();
                const pageAccess = accessData.find(p => p.page_id === pageId);
                
                if (pageAccess && pageAccess.access !== 4) {
                    setHasAccess(true);
                    setAccessLevel(pageAccess.access);
                } else {
                    console.warn(`Access denied for page ID ${pageId}. Redirecting.`);
                    // alert("You do not have permission to view this page.");
                    router.push('/dashboard');
                    setHasAccess(false);
                }

            } catch (error) {
                console.error('User access check failed:', error);
                alert("Could not verify your access. Redirecting to dashboard.");
                router.push('/');
                setHasAccess(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAccess();
    }, [pageId, router]);

    return { isLoading, hasAccess, accessLevel };
}